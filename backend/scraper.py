import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import random
import time
from pymongo import MongoClient
from stem.control import Controller
import re
import html2text

# ---- Tor Auth using ControlPort ----
def authenticate_tor(password):
    try:
        with Controller.from_port(port=9051) as controller:
            controller.authenticate(password=password)
            print("[+] Authenticated with Tor successfully.")
    except Exception as e:
        print(f"[!] Tor auth failed: {e}")

# ---- MongoDB Setup ----
client = MongoClient("mongodb://localhost:27017/")
db = client['darkweb_crawler']
links_collection = db['high_value_onion_links']
content_collection = db['threat_intel_content']

# ---- Tor Proxy Setup ----
proxies = {
    'http': 'socks5h://127.0.0.1:9050',
    'https': 'socks5h://127.0.0.1:9050'
}

# ---- User-Agents ----
user_agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Mozilla/5.0 (X11; Linux x86_64)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "Mozilla/5.0 (Windows NT 6.1; WOW64)"
]

# ---- Threat Intelligence Keywords ----
THREAT_KEYWORDS = [
    # Marketplaces
    'market', 'shop', 'store', 'vendor', 'product', 'listing', 'price',
    # Cybercrime
    'hack', 'exploit', 'leak', 'database', 'breach', 'dump', 'crack',
    'bypass', 'malware', 'ransomware', 'rat', 'botnet', 'ddos', 'spam',
    'phish', 'scam', 'carding', 'cvv', 'bank log', 'paypal', 'account',
    'credentials', 'login', 'password', 'database', 'sql', 'inject',
    # Financial Fraud
    'counterfeit', 'fake', 'document', 'id', 'passport', 'license',
    'credit card', 'debit card', 'fullz', 'dumps', 'track', 'pin',
    # Drugs/Weapons
    'drug', 'weed', 'cocaine', 'heroin', 'meth', 'amphetamine',
    'firearm', 'weapon', 'gun', 'rifle', 'pistol', 'ammo',
    # Services
    'service', 'hitman', 'hacker', 'for hire', 'escrow', 'review',
    # Cryptocurrency
    'bitcoin', 'monero', 'xmr', 'btc', 'ether', 'crypto', 'wallet',
    'mixer', 'tumbler', 'laundry',
    # Other
    'hidden', 'underground', 'illegal', 'darknet', 'tutorial', 'guide',
    'forum', 'board', 'community', 'discussion'
]

# ---- Extended Threat Keywords ----
EXTENDED_KEYWORDS = THREAT_KEYWORDS + [
    # Additional financial terms
    'wire transfer', 'western union', 'moneygram', 'payoneer', 'venmo',
    'cashapp', 'zelle', 'swift', 'iban', 'routing number',
    # Exploit-specific
    'zero-day', 'cve-', 'remote code execution', 'privilege escalation',
    'sql injection', 'xss', 'csrf', 'lfi', 'rfi', 'ssrf',
    # Malware types
    'trojan', 'worm', 'spyware', 'keylogger', 'rootkit', 'backdoor',
    'crypter', 'stealer', 'infostealer', 'formgrabber',
    # Operational security
    'opsec', 'vpn', 'proxy', 'tails', 'whonix', 'pgp', 'encryption',
    'burner', 'clean', 'compartmentalization'
]

# ---- Content Extraction Helpers ----
def extract_crypto(text):
    """Extract cryptocurrency addresses from text"""
    patterns = {
        'bitcoin': r'(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}',
        'ethereum': r'0x[a-fA-F0-9]{40}',
        'monero': r'4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}',
        'litecoin': r'[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}'
    }
    results = {}
    for coin, pattern in patterns.items():
        results[coin] = re.findall(pattern, text)
    return results

def extract_emails(text):
    """Extract email addresses from text"""
    return re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)

def clean_text(text):
    """Clean and normalize text content"""
    text = ' '.join(text.split())  # Remove excessive whitespace
    text = re.sub(r'[^\w\s.,!?;:\'"-]', '', text)  # Remove special chars
    return text.strip()

# ---- Core Scraping Function ----
def scrape_high_value(url):
    headers = {'User-Agent': random.choice(user_agents)}
    try:
        print(f"[+] Scraping: {url}")
        response = requests.get(url, headers=headers, proxies=proxies, timeout=25)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract metadata
            title = soup.title.string if soup.title else ""
            description = soup.find('meta', attrs={'name': 'description'})
            description = description['content'] if description else ""
            
            # Extract clean text content
            visible_text = ' '.join(t.strip() for t in soup.findAll(text=True))
            visible_text = clean_text(visible_text)
            
            # Convert to markdown for better structure
            h = html2text.HTML2Text()
            h.ignore_links = False
            h.ignore_images = True
            markdown_content = h.handle(response.text)
            
            # Extract threat intelligence artifacts
            crypto_addresses = extract_crypto(visible_text)
            emails = extract_emails(visible_text)
            
            # Keyword analysis
            keyword_hits = {kw: visible_text.lower().count(kw) 
                           for kw in EXTENDED_KEYWORDS 
                           if kw in visible_text.lower()}
            
            # Prepare document for NLP processing
            domain = urlparse(url).netloc
            doc = {
                'url': url,
                'domain': domain,
                'title': title,
                'description': description,
                'raw_html': response.text,
                'clean_text': visible_text,
                'markdown_content': markdown_content,
                'crypto_addresses': crypto_addresses,
                'emails': emails,
                'keyword_hits': keyword_hits,
                'timestamp': time.time(),
                'nlp_processed': False,  # Flag for NLP pipeline
                'threat_score': len(keyword_hits)  # Simple threat score
            }
            
            # Save to database
            if content_collection.count_documents({'url': url}) == 0:
                content_collection.insert_one(doc)
                print(f"    └─ Saved content: {url} (Score: {len(keyword_hits)})")
            else:
                content_collection.update_one({'url': url}, {'$set': doc})
                print(f"    └─ Updated content: {url} (Score: {len(keyword_hits)})")
            
            return True
            
    except Exception as e:
        print(f"    └─ [!] Failed to scrape {url}: {e}")
        return False

# ---- Main ----
if __name__ == "__main__":
    authenticate_tor("Lalit@2003")
    
    # Get all high-value URLs from the crawler collection
    high_value_urls = [doc['url'] for doc in links_collection.find(
        {'status': 'active'}, 
        {'url': 1}
    )]
    
    print(f"[*] Found {len(high_value_urls)} high-value URLs to scrape")
    
    # Scrape each URL with random delays
    for i, url in enumerate(high_value_urls, 1):
        scrape_high_value(url)
        
        # Random delay between 15-45 seconds
        delay = random.uniform(15, 45)
        print(f"    └─ Waiting {delay:.1f} seconds... (Progress: {i}/{len(high_value_urls)})")
        time.sleep(delay)
    
    print("\n[✓] Scraping complete. Threat intelligence content saved for NLP processing.")
