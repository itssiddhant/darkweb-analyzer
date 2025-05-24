from flask import Flask, request, jsonify, render_template, Response, stream_with_context
# from helper import generate_plot

from flask_cors import CORS
from flask_sock import Sock
import os
import time
import pandas as pd
import plotly.express as px
import io
from datetime import datetime
import base64
import json
from dotenv import load_dotenv
import logging
import threading
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv("./config/.env")

app = Flask(__name__)
CORS(app, 
     supports_credentials=True,
     resources={r"/*": {
         "origins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
         "expose_headers": ["Content-Type", "Authorization"],
         "max_age": 3600
     }})

# Error handling middleware
@app.errorhandler(Exception)
def handle_error(error):
    logger.error(f"Error occurred: {str(error)}")
    return jsonify({
        "status": "error",
        "message": str(error)
    }), 500

sock = Sock(app)

# Load JSON data
json_file_path = os.path.join(os.path.dirname(__file__), "data", "threat_intel_content.json")
logger.info(f"Loading JSON file from: {json_file_path}")

def load_json_data():
    """Load and validate JSON data"""
    try:
        if os.path.exists(json_file_path):
            with open(json_file_path, 'r', encoding='utf-8') as f:
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
            logger.warning("JSON file not found, creating new file")
            return []
    except Exception as e:
        logger.error(f"Error loading JSON file: {str(e)}")
        # Try to recover by reading line by line
        try:
            items = []
            with open(json_file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and line.startswith('{') and line.endswith('}'):
                        try:
                            items.append(json.loads(line))
                        except json.JSONDecodeError:
                            continue
            logger.info(f"Recovered {len(items)} items from malformed JSON")
            return items
        except Exception as e2:
            logger.error(f"Failed to recover data: {str(e2)}")
            return []

def save_json_data(data):
    """Save data to JSON file"""
    try:
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)
        logger.info("Data saved to JSON file")
    except Exception as e:
        logger.error(f"Error saving JSON file: {str(e)}")

# Load initial data
collection = load_json_data()

# Cache for storing generated data with TTL
data_cache = {}
cache_ttl = 300  # 5 minutes
last_cache_cleanup = time.time()

# Thread pool for async operations
executor = ThreadPoolExecutor(max_workers=4)

def cleanup_cache():
    global last_cache_cleanup
    current_time = time.time()
    if current_time - last_cache_cleanup > cache_ttl:
        expired_keys = [k for k, v in data_cache.items() if current_time - v['timestamp'] > cache_ttl]
        for k in expired_keys:
            del data_cache[k]
        last_cache_cleanup = current_time

def generate_plot(data, plot_type="bar", title="Visualization"):
    if not data:
        logger.warning("No data provided for plot generation")
        return None
        
    try:
        df = pd.DataFrame(data)
        
        # Further optimize plot generation
        if len(df) > 100:
            logger.info(f"Large dataset detected ({len(df)} rows), optimizing plot generation")
            if plot_type == "bar":
                df = df.groupby('label')['value'].sum().reset_index()
            elif plot_type == "map":
                df = df.sample(min(100, len(df)))
        
        # Use simpler plot configurations
        if plot_type == "bar":
            fig = px.bar(
                df, 
                x='label', 
                y='value', 
                title=title,
                template='plotly_white',
                width=600,
                height=400
            )
        elif plot_type == "pie":
            fig = px.pie(
                df, 
                names='label', 
                values='value', 
                title=title,
                template='plotly_white',
                width=600,
                height=400
            )
        elif plot_type == "map":
            if df.empty:
                logger.warning("Empty DataFrame for map plot")
                return None
            fig = px.scatter_geo(
                df, 
                lat='latitude', 
                lon='longitude', 
                hover_name='ip', 
                title=title,
                template='plotly_white',
                width=600,
                height=400
            )
        else:
            fig = px.histogram(
                df, 
                x='label', 
                y='value', 
                title=title,
                template='plotly_white',
                width=600,
                height=400
            )
        
        # Optimize image generation
        img = io.BytesIO()
        fig.write_image(
            img, 
            format='png',
            scale=1,
            engine='kaleido'
        )
        img.seek(0)
        encoded = base64.b64encode(img.read()).decode('utf-8')
        return f"data:image/png;base64,{encoded}"
    except Exception as e:
        logger.error(f"Error generating plot: {str(e)}")
        return None

@app.route('/')
def home():
    return "DarkWeb Intelligence API is Running"

@app.route('/search', methods=['GET'])
def search():
    try:
        query = request.args.get('query', '')
        if not query:
            return jsonify({
                "status": "error",
                "message": "No search query provided"
            }), 400
            
        print(f"🔍 Processing search query: {query}")
        query = str(query).lower()  # Ensure query is a string
        results = []
        
        for doc in collection:
            # Skip documents without nlp_processed or with boolean nlp_processed
            if not doc.get('nlp_processed') or not isinstance(doc.get('nlp_processed'), dict):
                continue

            # Search in various fields with null checks
            content = str(doc.get('clean_text', '') or '').lower()
            title = str(doc.get('title', '') or '').lower()
            url = str(doc.get('url', '') or '').lower()
            
            # Search in IOCs
            iocs = doc.get('nlp_processed', {}).get('iocs', {})
            ioc_matches = []
            for ioc_type, ioc_list in iocs.items():
                if isinstance(ioc_list, list):
                    for ioc in ioc_list:
                        if ioc and query in str(ioc).lower():
                            ioc_matches.append(f"{ioc_type}: {ioc}")

            # Search in topics
            topics = doc.get('nlp_processed', {}).get('topics', [])
            topic_matches = [topic for topic in topics if topic and query in str(topic).lower()]

            # Exact URL match should have highest priority
            if query == url:
                print(f"✅ Found exact URL match: {url}")
                results.insert(0, {
                    'url': doc.get('url', ''),
                    'title': doc.get('title', ''),
                    'timestamp': doc.get('processed_at', ''),
                    'clean_text': doc.get('clean_text', ''),
                    'sentiment': doc.get('nlp_processed', {}).get('sentiment', {}),
                    'topics': doc.get('nlp_processed', {}).get('topics', []),
                    'iocs': doc.get('nlp_processed', {}).get('iocs', {}),
                    'matches': {
                        'content': query in content,
                        'title': query in title,
                        'url': True,
                        'iocs': ioc_matches,
                        'topics': topic_matches
                    }
                })
                continue

            # If query found in any field
            if (query in content or query in title or query in url or 
                ioc_matches or topic_matches):
                print(f"✅ Found match in document: {url}")
                results.append({
                    'url': doc.get('url', ''),
                    'title': doc.get('title', ''),
                    'timestamp': doc.get('processed_at', ''),
                    'clean_text': doc.get('clean_text', ''),
                    'sentiment': doc.get('nlp_processed', {}).get('sentiment', {}),
                    'topics': doc.get('nlp_processed', {}).get('topics', []),
                    'iocs': doc.get('nlp_processed', {}).get('iocs', {}),
                    'matches': {
                        'content': query in content,
                        'title': query in title,
                        'url': query in url,
                        'iocs': ioc_matches,
                        'topics': topic_matches
                    }
                })

        print(f"📊 Found {len(results)} results")
        
        # Sort results by timestamp (except for exact URL matches which stay at top)
        if len(results) > 1:
            results[1:] = sorted(results[1:], key=lambda x: x.get('timestamp', ''), reverse=True)

        return jsonify({
            "status": "success",
            "data": {
                "query": query,
                "results": results,
                "total": len(results)
            }
        })

    except Exception as e:
        print(f"❌ Error in search endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error processing search: {str(e)}"
        }), 500

@app.route('/visualize')
def visualize():
    try:
        viz_type = request.args.get('type', 'iocs')
        logger.info(f"Processing visualization request for type: {viz_type}")
        
        # Check cache first
        cache_key = f"viz_{viz_type}"
        if cache_key in data_cache:
            cache_time = time.time() - data_cache[cache_key]['timestamp']
            if cache_time < cache_ttl:
                logger.info(f"Returning cached data for {viz_type}")
                return jsonify(data_cache[cache_key]['data'])
        
        # Process visualization data
        result = process_visualization_data(viz_type)
        
        # Cache the result
        data_cache[cache_key] = {
            'data': result,
            'timestamp': time.time()
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in visualization endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error processing visualization: {str(e)}"
        })

def process_visualization_data(viz_type):
    try:
        logger.info(f"Processing visualization data for type: {viz_type}")
        
        # Get total document count
        total_docs = len(collection)
        logger.info(f"Total documents in collection: {total_docs}")
        
        # Get count of documents with nlp_processed field
        processed_docs = len([doc for doc in collection if doc.get('nlp_processed') and isinstance(doc.get('nlp_processed'), dict)])
        logger.info(f"Documents with nlp_processed field: {processed_docs}")
        
        if processed_docs == 0:
            logger.warning("No processed documents found")
            return {
                "status": "success",
                "data": {
                    "type": viz_type,
                    "title": f"No {viz_type} data available",
                    "labels": [],
                    "datasets": [{"data": []}]
                }
            }
        
        if viz_type == "iocs":
            logger.info("Processing IOCs data")
            # Get counts of all IOC types
            ioc_counts = {
                'ips': 0,
                'domains': 0,
                'emails': 0,
                'cve': 0,
                'malware': 0,
                'hacker': 0
            }
            
            # Process in batches to avoid memory issues
            batch_size = 100
            for i in range(0, len(collection), batch_size):
                batch = collection[i:i + batch_size]
                for doc in batch:
                    if doc.get('nlp_processed') and isinstance(doc.get('nlp_processed'), dict):
                        iocs = doc['nlp_processed'].get('iocs', {})
                        if isinstance(iocs, dict):
                            ioc_counts['ips'] += len(iocs.get('ips', []))
                            ioc_counts['domains'] += len(iocs.get('domains', []))
                            ioc_counts['emails'] += len(iocs.get('emails', []))
                            ioc_counts['cve'] += len(iocs.get('cve', []))
                            ioc_counts['malware'] += len(iocs.get('malware', []))
                            ioc_counts['hacker'] += len(iocs.get('hacker', []))
            
            return {
                "status": "success",
                "data": {
                    "type": "bar",
                    "title": "IOCs Distribution",
                    "labels": ["IPs", "Domains", "Emails", "CVEs", "Malware", "Hackers"],
                    "datasets": [{
                        "label": "Count",
                        "data": [
                            ioc_counts['ips'],
                            ioc_counts['domains'],
                            ioc_counts['emails'],
                            ioc_counts['cve'],
                            ioc_counts['malware'],
                            ioc_counts['hacker']
                        ],
                        "backgroundColor": ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
                    }]
                }
            }
            
        elif viz_type == "sentiment":
            logger.info("Processing sentiment data")
            # Get sentiment distribution
            sentiment_counts = {
                'positive': 0,
                'neutral': 0,
                'negative': 0
            }
            
            # Process in batches
            batch_size = 100
            for i in range(0, len(collection), batch_size):
                batch = collection[i:i + batch_size]
                for doc in batch:
                    if doc.get('nlp_processed') and isinstance(doc.get('nlp_processed'), dict):
                        sentiment = doc['nlp_processed'].get('sentiment', {})
                        if isinstance(sentiment, dict):
                            label = sentiment.get('label', 'neutral')
                            sentiment_counts[label] += 1
            
            return {
                "status": "success",
                "data": {
                    "type": "pie",
                    "title": "Sentiment Distribution",
                    "labels": ["Positive", "Neutral", "Negative"],
                    "datasets": [{
                        "data": [
                            sentiment_counts['positive'],
                            sentiment_counts['neutral'],
                            sentiment_counts['negative']
                        ],
                        "backgroundColor": ["#10b981", "#f59e0b", "#ef4444"]
                    }]
                }
            }
            
        elif viz_type == "geolocation":
            logger.info("Processing geolocation data")
            points = []
            
            # Process in batches
            batch_size = 100
            for i in range(0, len(collection), batch_size):
                batch = collection[i:i + batch_size]
                for doc in batch:
                    if doc.get('nlp_processed') and isinstance(doc.get('nlp_processed'), dict):
                        geolocation = doc['nlp_processed'].get('geolocation', [])
                        if isinstance(geolocation, list):
                            for geo in geolocation:
                                if isinstance(geo, dict) and geo.get('latitude') and geo.get('longitude'):
                                    points.append({
                                        'lat': geo['latitude'],
                                        'lng': geo['longitude'],
                                        'country': geo.get('country', 'Unknown'),
                                        'city': geo.get('city', 'Unknown'),
                                        'timestamp': doc.get('processed_at', '')
                                    })
            
            return {
                "status": "success",
                "data": {
                    "type": "map",
                    "title": "Geolocation Distribution",
                    "points": points
                }
            }
            
        elif viz_type == "timeline":
            logger.info("Processing timeline data")
            # Group threats by date
            threats_by_date = {}
            
            # Process in batches
            batch_size = 100
            for i in range(0, len(collection), batch_size):
                batch = collection[i:i + batch_size]
                for doc in batch:
                    if doc.get('nlp_processed') and isinstance(doc.get('nlp_processed'), dict):
                        date = doc.get('processed_at', '').split('T')[0]
                        if date:
                            if date not in threats_by_date:
                                threats_by_date[date] = []
                            
                            threat = {
                                'url': doc.get('url', ''),
                                'title': doc.get('title', ''),
                                'sentiment': doc['nlp_processed'].get('sentiment', {}),
                                'topics': doc['nlp_processed'].get('topics', []),
                                'iocs': doc['nlp_processed'].get('iocs', {})
                            }
                            threats_by_date[date].append(threat)
            
            # Sort dates
            sorted_dates = sorted(threats_by_date.keys())
            
            return {
                "status": "success",
                "data": {
                    "type": "timeline",
                    "title": "Threat Timeline",
                    "dates": sorted_dates,
                    "threats": threats_by_date
                }
            }
            
        else:
            logger.warning(f"Invalid visualization type: {viz_type}")
            return {
                "status": "error",
                "message": f"Invalid visualization type: {viz_type}"
            }
            
    except Exception as e:
        logger.error(f"Error processing visualization data: {str(e)}")
        return {
            "status": "error",
            "message": f"Error processing visualization data: {str(e)}"
        }

@app.route('/monitor', methods=['GET'])
def monitor():
    try:
        # Get document statistics
        total_docs = len(collection)
        processed_docs = len([doc for doc in collection if doc.get('nlp_processed') and isinstance(doc.get('nlp_processed'), dict)])
        pending_docs = total_docs - processed_docs

        # Get latest threats
        latest_threats = []
        for doc in collection:
            if doc.get('nlp_processed') and isinstance(doc.get('nlp_processed'), dict):
                # Create a copy of the document with only needed fields
                threat = {
                    'url': doc.get('url', ''),
                    'timestamp': doc.get('processed_at', ''),
                    'iocs': doc.get('nlp_processed', {}).get('iocs', {}),
                    'sentiment': doc.get('nlp_processed', {}).get('sentiment', {}),
                    'topics': doc.get('nlp_processed', {}).get('topics', [])
                }
                latest_threats.append(threat)

        # Sort by timestamp
        latest_threats.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        latest_threats = latest_threats[:10]

        return jsonify({
            'total_docs': total_docs,
            'processed_docs': processed_docs,
            'pending_docs': pending_docs,
            'threats': latest_threats
        })
    except Exception as e:
        logger.error(f"Error in monitor endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error processing monitor data: {str(e)}"
        }), 500

@app.route('/topics', methods=['GET'])
def get_topics():
    latest = sorted(collection, key=lambda x: x.get('processed_at', ''), reverse=True)[:1]
    if not latest or 'topics' not in latest[0].get('nlp_processed', {}):
        return jsonify({'topics': {}})
    return jsonify({'topics': latest[0]['nlp_processed']['topics']})

@app.route('/topics/<topic_id>', methods=['GET'])
def get_topic_documents(topic_id):
    documents = [
        doc for doc in collection
        if doc.get('nlp_processed') and topic_id in doc['nlp_processed'].get('topics', [])
    ]
    return jsonify({'documents': documents})

@sock.route('/ws/processor')
def processor_ws(ws):
    while True:
        try:
            total = len(collection)
            processed = len([doc for doc in collection if doc.get('nlp_processed') and isinstance(doc.get('nlp_processed'), dict)])
            
            # Get latest threats
            latest_threats = []
            for doc in collection:
                if doc.get('nlp_processed') and isinstance(doc.get('nlp_processed'), dict):
                    # Create a copy of the document with only needed fields
                    threat = {
                        'url': doc.get('url', ''),
                        'timestamp': doc.get('processed_at', ''),
                        'iocs': doc.get('nlp_processed', {}).get('iocs', {}),
                        'sentiment': doc.get('nlp_processed', {}).get('sentiment', {}),
                        'topics': doc.get('nlp_processed', {}).get('topics', [])
                    }
                    latest_threats.append(threat)

            # Sort by timestamp
            latest_threats.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            latest_threats = latest_threats[:5]

            ws.send(json.dumps({
                'type': 'status_update',
                'data': {
                    'processed': processed,
                    'pending': total - processed,
                    'latest_threats': latest_threats
                }
            }))
            time.sleep(5)
        except Exception as e:
            logger.error(f"WebSocket error: {str(e)}")
            break

@app.route('/export', methods=['GET'])
def export_all_data():
    # Only include processed docs
    export_data = [
        {
            "url": doc.get("url", ""),
            "timestamp": doc.get("processed_at", ""),
            "sentiment": doc.get("nlp_processed", {}).get("sentiment", {}),
            "topics": doc.get("nlp_processed", {}).get("topics", []),
            "iocs": doc.get("nlp_processed", {}).get("iocs", {}),
            "geolocation": doc.get("nlp_processed", {}).get("geolocation", []),
        }
        for doc in collection
        if doc.get("nlp_processed") and isinstance(doc.get("nlp_processed"), dict)
    ]
    return jsonify(export_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
