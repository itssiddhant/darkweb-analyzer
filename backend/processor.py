import os
import re
import spacy
from textblob import TextBlob
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import LatentDirichletAllocation
import pandas as pd
import en_core_web_lg
import networkx as nx
import matplotlib.pyplot as plt
from collections import Counter
import geoip2.database
import pycountry
from dotenv import load_dotenv
import requests
import html2text
from datetime import datetime
import json
from OTXv2 import OTXv2
import concurrent.futures
import time

# Load environment
load_dotenv("./config/.env")
nlp = en_core_web_lg.load()
nlp.add_pipe('sentencizer')

class DarkWebNLP:
    def __init__(self):
        # Use JSON file instead of BSON
        self.json_file_path = os.path.join(os.path.dirname(__file__), "data", "threat_intel_content.json")
        print(f"Loading JSON file from: {self.json_file_path}")
        self.collection = self._load_json_data()
        self.geoip = self._init_geoip()
        self.h = html2text.HTML2Text()
        self.h.ignore_links = False
        self.h.ignore_images = True
        self.otx = self._init_otx()
        self.max_workers = 4  # Number of parallel workers
        self.batch_size = 50  # Process documents in batches
    
    def _load_json_data(self):
        """Load data from JSON file"""
        try:
            if os.path.exists(self.json_file_path):
                with open(self.json_file_path, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    # If the content is not a valid JSON array, try to fix it
                    if not content.startswith('['):
                        # Split by newlines and parse each line as a separate JSON object
                        items = []
                        for line in content.split('\n'):
                            line = line.strip()
                            if line and line.startswith('{') and line.endswith('}'):
                                try:
                                    items.append(json.loads(line))
                                except json.JSONDecodeError:
                                    continue
                        return items
                    return json.loads(content)
            else:
                print("⚠️ JSON file not found, creating new file")
                return []
        except Exception as e:
            print(f"⚠️ Error loading JSON file: {str(e)}")
            # Try to recover by reading line by line
            try:
                items = []
                with open(self.json_file_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and line.startswith('{') and line.endswith('}'):
                            try:
                                items.append(json.loads(line))
                            except json.JSONDecodeError:
                                continue
                print(f"✅ Recovered {len(items)} items from malformed JSON")
                return items
            except Exception as e2:
                print(f"❌ Failed to recover data: {str(e2)}")
                return []
    
    def _save_json_data(self):
        """Save data to JSON file"""
        try:
            with open(self.json_file_path, 'w', encoding='utf-8') as f:
                json.dump(self.collection, f, indent=2, default=str)
            print("✅ Data saved to JSON file")
        except Exception as e:
            print(f"❌ Error saving JSON file: {str(e)}")
    
    def _init_geoip(self):
        if os.path.exists("./data/GeoLite2-City.mmdb"):
            return {
                'city': geoip2.database.Reader('./data/GeoLite2-City.mmdb'),
                'asn': geoip2.database.Reader('./data/GeoLite2-ASN.mmdb')
            }
        return None
    
    def _init_otx(self):
        """Initialize OTX client if API key is available"""
        api_key = os.getenv("OTX_API_KEY")
        if not api_key:
            print("⚠️ OTX API key not found in environment variables")
            return None
        try:
            print("🔑 Initializing OTX client...")
            print("📝 Creating OTXv2 instance...")
            otx_client = OTXv2(api_key)
            print("🔍 Testing OTX connection...")
            try:
                # Test with a simpler endpoint first
                print("📡 Testing basic connectivity...")
                response = requests.get(
                    'https://otx.alienvault.com/api/v1/pulses/subscribed',
                    headers={'X-OTX-API-KEY': api_key},
                    timeout=10
                )
                response.raise_for_status()
                print("✅ OTX client initialized successfully")
                return otx_client
            except requests.exceptions.Timeout:
                print("❌ OTX API request timed out after 10 seconds")
                return None
            except requests.exceptions.RequestException as e:
                print(f"❌ OTX API request failed: {str(e)}")
                return None
            except Exception as e:
                print(f"❌ Unexpected error during OTX test: {str(e)}")
                return None
        except Exception as e:
            print(f"⚠️ Failed to initialize OTX client: {str(e)}")
            return None
    
    def extract_iocs(self, text):
        doc = nlp(text)
        iocs = {
            'IP': re.findall(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', text),
            'EMAIL': re.findall(r'[\w\.-]+@[\w\.-]+', text),
            'DOMAIN': re.findall(r'(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]', text, re.IGNORECASE),
            'CRYPTO': re.findall(r'(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}|0x[a-fA-F0-9]{40}', text),
            'CVE': re.findall(r'CVE-\d{4}-\d{4,7}', text),
            'MALWARE': [],
            'HACKER': []
        }
        
        for ent in doc.ents:
            if ent.label_ in ('ORG', 'PERSON') and any(x in ent.text.lower() for x in ['group', 'crew', 'team', 'hacker']):
                iocs['HACKER'].append(ent.text)
            elif ent.label_ == 'PRODUCT' and any(x in ent.text.lower() for x in ['malware', 'rat', 'exploit', 'trojan', 'virus']):
                iocs['MALWARE'].append(ent.text)
        
        # Remove duplicates and empty lists
        return {k: list(set(v)) for k, v in iocs.items() if v}
    
    def check_abuseipdb(self, ip):
        if not os.getenv("ABUSEIPDB_API_KEY"):
            return None
        try:
            response = requests.get(
                "https://api.abuseipdb.com/api/v2/check",
                params={'ipAddress': ip},
                headers={'Key': os.getenv("ABUSEIPDB_API_KEY"), 'Accept': 'application/json'},
                timeout=5  # Reduced timeout
            )
            return response.json().get('data', {}) if response.status_code == 200 else None
        except:
            return None
    
    def check_otx(self, indicator, indicator_type):
        """Check indicator against OTX"""
        if not self.otx:
            print("⚠️ OTX client not initialized")
            return None
        try:
            print(f"🔍 Checking {indicator_type} {indicator} against OTX...")
            result = self.otx.get_indicator_details_full(indicator_type, indicator)
            if result:
                print(f"✅ Found {indicator_type} {indicator} in OTX")
                return result
            else:
                print(f"ℹ️ {indicator_type} {indicator} not found in OTX")
                return None
        except requests.exceptions.RequestException as e:
            print(f"⚠️ OTX API request failed for {indicator_type} {indicator}: {str(e)}")
            return None
        except Exception as e:
            print(f"⚠️ Unexpected error checking OTX for {indicator_type} {indicator}: {str(e)}")
            return None
    
    def geolocate(self, ip):
        if not self.geoip:
            return None
        try:
            city = self.geoip['city'].city(ip)
            asn = self.geoip['asn'].asn(ip)
            return {
                'country': city.country.name,
                'city': city.city.name,
                'latitude': city.location.latitude,
                'longitude': city.location.longitude,
                'asn': asn.autonomous_system_number,
                'isp': asn.autonomous_system_organization
            }
        except:
            return None
    
    def analyze_sentiment(self, text):
        analysis = TextBlob(text)
        threat_terms = ['exploit', 'leak', 'attack', 'malware', 'breach', 'vulnerability', 'hack', 'compromise']
        threat_score = sum(text.lower().count(term) for term in threat_terms)
        
        # Determine sentiment label based on polarity and threat score
        if analysis.sentiment.polarity > 0.2 and threat_score < 2:
            label = 'positive'
        elif analysis.sentiment.polarity < -0.2 or threat_score > 3:
            label = 'negative'
        else:
            label = 'neutral'
        
        return {
            'polarity': analysis.sentiment.polarity,
            'subjectivity': analysis.sentiment.subjectivity,
            'threat_score': threat_score,
            'label': label
        }
    
    def topic_modeling(self, texts, n_topics=5):
        if not texts:
            return {}
            
        tfidf = TfidfVectorizer(max_df=0.95, min_df=2, stop_words='english')
        lda = LatentDirichletAllocation(n_components=n_topics, random_state=42)
        X = tfidf.fit_transform(texts)
        lda.fit(X)
        
        topics = {}
        for idx, topic in enumerate(lda.components_):
            topics[f"topic_{idx}"] = [
                (tfidf.get_feature_names_out()[i], round(topic[i], 3)) 
                for i in topic.argsort()[-10:][::-1]
            ]
        return topics
    
    def process_document(self, doc):
        """Process a single document"""
        try:
            content = doc.get('clean_text', '') or self.h.handle(doc.get('raw_html', ''))
            if not content:
                return None
                
            iocs = self.extract_iocs(content)
            
            # Threat intelligence lookups
            threat_intel = {
                'abuseipdb': {ip: self.check_abuseipdb(ip) for ip in iocs.get('IP', [])},
                'otx': {
                    'ip': {ip: self.check_otx(ip, 'IPv4') for ip in iocs.get('IP', [])},
                    'domain': {domain: self.check_otx(domain, 'domain') for domain in iocs.get('DOMAIN', [])},
                    'hash': {hash: self.check_otx(hash, 'file_hash') for hash in iocs.get('HASH', [])}
                }
            }
            
            # Geolocation
            geo_data = []
            for ip in iocs.get('IP', []):
                geo = self.geolocate(ip)
                if geo:
                    geo_data.append({
                        'ip': ip,
                        'country': geo['country'],
                        'city': geo['city'],
                        'latitude': geo['latitude'],
                        'longitude': geo['longitude'],
                        'asn': geo['asn'],
                        'isp': geo['isp']
                    })
            
            # Sentiment analysis
            sentiment = self.analyze_sentiment(content)
            
            return {
                'iocs': {
                    'ips': iocs.get('IP', []),
                    'domains': iocs.get('DOMAIN', []),
                    'emails': iocs.get('EMAIL', []),
                    'crypto': iocs.get('CRYPTO', []),
                    'cve': iocs.get('CVE', []),
                    'malware': iocs.get('MALWARE', []),
                    'hacker': iocs.get('HACKER', [])
                },
                'threat_intel': threat_intel,
                'geolocation': geo_data,
                'sentiment': {
                    'label': sentiment['label'],
                    'score': sentiment['polarity'],
                    'threat_score': sentiment['threat_score']
                },
                'clean_text': content
            }
        except Exception as e:
            print(f"❌ Failed to process document: {str(e)}")
            return None
    
    def process_all_content(self):
        """Process all unanalyzed pages from threat_intel_content"""
        # Find documents that either don't have nlp_processed or have it as a boolean False
        unprocessed = [
            doc for doc in self.collection 
            if not doc.get('nlp_processed') or 
               (isinstance(doc.get('nlp_processed'), bool) and not doc.get('nlp_processed'))
        ]
        
        print(f"📊 Total documents in collection: {len(self.collection)}")
        print(f"📝 Documents needing processing: {len(unprocessed)}")
        
        if not unprocessed:
            print("✅ No unprocessed documents found")
            return
        
        print(f"📊 Processing {len(unprocessed)} documents...")
        
        # Process documents in batches
        for i in range(0, len(unprocessed), self.batch_size):
            batch = unprocessed[i:i + self.batch_size]
            print(f"Processing batch {i//self.batch_size + 1} of {(len(unprocessed) + self.batch_size - 1)//self.batch_size}")
            
            # Process documents in parallel
            with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                futures = {executor.submit(self.process_document, doc): doc for doc in batch}
                for future in concurrent.futures.as_completed(futures):
                    doc = futures[future]
                    try:
                        result = future.result()
                        if result:
                            doc['nlp_processed'] = result
                            doc['processed_at'] = datetime.utcnow().isoformat()
                            print(f"✅ Processed {doc.get('url', 'unknown')}")
                    except Exception as e:
                        print(f"❌ Failed to process {doc.get('url', 'unknown')}: {str(e)}")
            
            # Save after each batch
            self._save_json_data()
            time.sleep(1)  # Small delay between batches
        
        # Batch process for topic modeling
        texts = [doc.get('clean_text', '') or self.h.handle(doc.get('raw_html', '')) for doc in unprocessed]
        topics = self.topic_modeling(texts)
        
        # Update documents with topics
        for doc in unprocessed:
            if doc.get('nlp_processed'):
                main_topics = []
                for topic_id, topic_words in topics.items():
                    if topic_words:  # Check if topic has words
                        main_topics.append(topic_words[0][0])  # Get the first (most important) word
                doc['nlp_processed']['topics'] = main_topics
        
        # Final save
        self._save_json_data()
        print("✅ All documents processed successfully")

    def force_reprocess(self):
        """Force reprocessing of all documents by clearing nlp_processed field"""
        print("🔄 Forcing reprocessing of all documents...")
        for doc in self.collection:
            doc['nlp_processed'] = False
        self._save_json_data()
        print(f"✅ Reset {len(self.collection)} documents for reprocessing")
        self.process_all_content()

if __name__ == "__main__":
    processor = DarkWebNLP()
    # Force reprocess all documents
    processor.force_reprocess()
