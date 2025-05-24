import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import random
import time
from pymongo import MongoClient
from stem.control import Controller
import re

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
collection = db['high_value_onion_links']  # Changed collection name

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

visited = set()

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

# ---- High-Value Seed URLs ----
seed_urls = [
    # Marketplaces
    "http://darkmarketxxewor4q.onion",
    "http://empiremktxgjovhm.onion",
    "http://monopolyzw3j4o7b.onion",
    # Forums
    "http://dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad.onion",  # Dread
    "http://hackbb2ge2mrxmn.onion",  # HackBB
    "http://cryptbb2ge2mrxmn.onion",  # CryptBB
    # Leaks/Databases
    "http://leakbase6yw2zqyq.onion",  # Leakbase
    "http://rrcc5uuudhh4oz3c.onion",  # Intel Exchange
    # Search Engines
    "http://torrezmarketwww6rqo3m.onion",
    "http://2fd6cemt4gmccflhm6imvdfvli3nf7zn6rfrwpsy7uhxrgbypvwf5fad.onion",  # Excavator
    "http://tz75oxijdfwnobeh3sn6vfethrz4zqdasylrmp7euntqivbsaubojmyd.onion/index.php",  # TOR Search
	"http://tx3rlqycg7wais576gsuirtpuuvkxewpur2m3bkn4t5kludxw7sq4gad.onion",
	"http://f7wvgv65cd6k76zk6zfednaarhpjxlj622ws5wslfegmpil3rfohxyad.onion",
	"http://4l3acx6ew22nq5kahvt5x73pp5eo4olc4yd3r5mgd4ie3ov4favkssyd.onion",
	"http://uf2ehwwzwms57qinnhgz4tprzrj6qd266gofih5scpa2vgd5rcvlzbyd.onion",
	"http://uf2ehwwzwms57qinnhgz4tprzrj6qd266gofih5scpa2vgd5rcvlzbyd.onion",
	"http://36jnqgsdxqkfhkxpyrvogv7zd4yi7gaqoo5z3ef3fosnuqc4iihc2wad.onion",
	"http://n2fes2crxls2vtfnsluttwuoaqsop4cipjclifuvqp42fdw75s5eudid.onion",
	"http://pasrct5dvveuhmvxcghnvc34naydm6hvuud3etxvihppt3cognaz4ryd.onion",
	"http://yidh4fzg3dz4bpv7blu6prwgvzm24sa77yz6cmoeiodjynychtirmbad.onion",
	"http://i32mp4t4ignn6pqqnt2yb27pn2w2jqyl2sujkbsexp6bzwdshg2sglad.onion",
	"http://q4silmzsy6bqp4babmomy225wntadkalzro26d2swuqjgqu5iwygsmid.onion",
	"http://enmtkzcibinuz5gtvicxd6dmoqfjbgq733fgdegpaym2h7mcnwqhsbqd.onion",
	"http://qdo7wya6u3idimqiklr3wuq5ixni7qv7yseygnp467o6nippmhwan6qd.onion",
	"http://73p263p4vvd3sw6ngvxu5p2lfqeu34t34a2gryqv73752mfd32a7n5ad.onion",
	"http://qriawihefr6mazslbojx5e4og3japjxauuxxfdafvfudag7o4ztwuhqd.onion",
	"http://ksx22ltkqmhbkzg6qju2lqvnynpjlcfrongxx2dwvoppl6bxa4dgl3ad.onion",
	"http://wm4e6yydjrgihojuecr76i4det57x5neszmu6emocdp76frz3t44gpqd.onion",
	"http://sh7edlkk3hdmqkp6gvqqeda5kplhxyh6tyxhspq2hiqcykt4mpfscdad.onion",
	"http://jmlnchnew4uebnf6avkfanlgwbt3bwamvv6vmfj3v5ooxbpgis5a5tqd.onion",
	"http://glczz3axozn7jxafuyv3vfsv4hh3bmpgoonacmk52xnawbm57bhijzqd.onion",
	"http://2pem6tjernrgfuozi4efeoarmxvavgf4wv3tymtpjweb3l4cxqngooad.onion",
	"http://uo57sqpw4h3g3y3w2j346vxidgcv2iwfaxeyt3ww3tzkj2i5k7a5tpqd.onion",
	"http://kw4zlnfhxje7top26u57iosg55i7dzuljjcyswo2clgc3mdliviswwyd.onion",
	"http://fahue6hb7odzns36vfoi2dqfvqvjq4btt7vo52a67jivmyz6a6h3vzqd.onion",
	"http://3kyl4i7bfdgwelmf.onion",
	"http://jmv73a3vjw55xatcpgceufgczsvvy7eelg6vkgffjab2l5hblkom2mad.onion",
	"http://lockbitapt2d73krlbewgv27tquljgxr33xbwwsp6rkyieto7u4ncead.onion",
	"https://coinomize.biz",
	"http://coino2q64k4fg3lkjsnhjeydzwykw22a56u5nf2rdfzkjuy3jbwvypqd.onion",
	"http://xmftsqhruthkhqmrm5irzrqvc7tku4xvyr7ht57zl7gfgywpyb4vcuid.onion",
	"http://silkroad7rn2puhj.onion",
	"http://silkroad4n7fwsrw.onion",
	"http://silkhto2wuinfl5kqqnciky7jfc3h3o7xakk2xvw6ieser4byfjjakyd.onion",
	"http://xzcjuec4fs5iitzc.onion",
	"http://subvertftwgomgti.onion",
	"http://cypjcv237t3qexjou5ciiwxkaaozzrxl2kpexb3lnpwmii7y7vqmctid.onion",
	"https://www.shadowbazaar.net",
	"http://deepweb4wt3m4dhutpxpe7d7wxdftfdf4hhag4sizgon6th5lcefloid.onion",
	"https://bbgate.com",
	"http://dwltorbltw3tdjskxn23j2mwz2f4q25j4ninl5bdvttiy4xb6cqzikid.onion",
	"http://awazonhndi7e5yfaobpk7j2tsnp4kfd2xa63tdtzcg7plc5fka4il4ad.onion",
	"http://darkzqtmbdeauwq5mzcmgeeuhet42fhfjj4p5wbak3ofx2yqgecoeqyd.onion",
	"http://zqktlwiuavvvqqt4ybvgvi7tyo4hjl5xgfuvpdf6otjiycgwqbym2qad.onion",
	"http://6nhmgdpnyoljh5uzr5kwlatx2u3diou4ldeommfxjz3wkhalzgjqxzqd.onion",
	"http://abyssou4y5ang24dn4cfkrwd3fsiczx7xg7n7mzlcthrpktfcar6j2qd.onion",
	"http://bizzle7qdloigdiiqionusf7dfw6tmrqhtjwkjviwtjmwovphqftvaid.onion",
	"http://danielas3rtn54uwmofdo3x2bsdifr47huasnmbgqzfrec5ubupvtpid.onion",
	"http://uyeygtqorgwxmp4bskauanuiofeh7frv35nvmghni5aihf32z27ogqqd.onion",
	"http://a7mupnlw776xwbt3zcaqrvrje2x44mpmwqszc5zzdseyldpq7ftyzsqd.onion",
	"http://pmrhqakmmgue4vvdfqds27vyiuhz2qj65sql4zqoeobxlx6onwte64qd.onion",
	"http://blackpyoc3gbnrlvxqvvytd3kxqj7pd226i2gvfyhysj24ne2snkmnyd.onion",
	"https://www.drugusersbible.com",
	"http://ka6n6npqxdk243ncrefuezozchb5rf3hqwm2fgtdmhwvcv7ognqfqjid.onion",
	"http://hashmzn4fhbu63vqwefqofecy6acoz2vbsbuditpkwuxr6cw5h55jgid.onion/index",
	"http://on6yxldxgmvjfx56aawf4wx32ivabkml7ij4hlagl5nw3urvnwdkkaad.onion",
	"http://gpgb4vmgfq2l6evpnmhchcv2vgrcssr7lbryucn4g3n22jzxkpnv3qid.onion",
	"http://filthyec2ys5vgfyi3b62z4leupxjb7eewzrkphkaivhoghornv33yid.onion",
	"http://cypjcv237t3qexjou5ciiwxkaaozzrxl2kpexb3lnpwmii7y7vqmctid.onion",
	"http://crownipsgwzaj3eby5pienlzanam5qjreedgvvqlctlkllx7l2x4nyyd.onion",
	"http://anubisrjpfcc43t4r4zl5ovayivjxqkn63ykkzfngjqvk26lnbgcyryd.onion",
	"http://mars24pazjige72veied4awxfb6gtkjauij7qkofveula7gc6fljy4qd.onion",
	"http://marsmtbn7bgpx5e4zwejteayf6lalp4sqwhjwefyc4noehghyrvp4ead.onion",
	"http://xmftsqhruthkhqmrm5irzrqvc7tku4xvyr7ht57zl7gfgywpyb4vcuid.onion",
	"http://hadesfouu52vnzzgxrfaiysz2istn2pf63gskps3dpjyubwzxx2z25yd.onion",
	"http://zkj7mzglnrbvu3elepazau7ol26cmq7acryvsqxvh4sreoydhzin7zid.onion",
	"http://cr32aykujaxqkfqyrjvt7lxovnadpgmghtb3y4g6jmx6oomr572kbuqd.onion",
	"http://74ck36pbaxz7ra6n7v5pbpm5n2tsdaiy4f6p775qvjmowxged65n3cid.onion",
	"http://f6wqhy6ii7metm45m4mg6yg76yytik5kxe6h7sestyvm6gnlcw3n4qad.onion",
	"http://zwf5i7hiwmffq2bl7euedg6y5ydzze3ljiyrjmm7o42vhe7ni56fm7qd.onion",
	"http://z7s2w5vruxbp2wzts3snxs24yggbtdcdj5kp2f6z5gimouyh3wiaf7id.onion",
	"http://c5xoy22aadb2rqgw3jh2m2irmu563evukqqddu5zjandunaimzaye5id.onion",
	"http://zqktlwiuavvvqqt4ybvgvi7tyo4hjl5xgfuvpdf6otjiycgwqbym2qad.onion/wiki/index.php/Main_Page",
	"http://jaz45aabn5vkemy4jkg4mi4syheisqn2wn2n4fsuitpccdackjwxplad.onion",
	"http://5wvugn3zqfbianszhldcqz2u7ulj3xex6i3ha3c5znpgdcnqzn24nnid.onion",
	"http://bj5hp4onm4tvpdb5rzf4zsbwoons67jnastvuxefe4s3v7kupjhgh6qd.onion",
	"http://z7s2w5vruxbp2wzts3snxs24yggbtdcdj5kp2f6z5gimouyh3wiaf7id.onion",
	"http://f6wqhy6ii7metm45m4mg6yg76yytik5kxe6h7sestyvm6gnlcw3n4qad.onion",
	"http://74ck36pbaxz7ra6n7v5pbpm5n2tsdaiy4f6p775qvjmowxged65n3cid.onion",
	"http://5kpq325ecpcncl4o2xksvaso5tuydwj2kuqmpgtmu3vzfxkpiwsqpfid.onion",
	"http://gch3dyxo5zuqbrrtd64zlvzwxden4jkikyqk3ikjhggqzoxixcmq2fid.onion",
	"http://2bcbla34hrkp6shb4myzb2wntl2fxdbrroc2t4t7c3shckvhvk4fw6qd.onion",
	"http://sa3ut5u4qdw7yiunpdieypzsrdylhbtafyhymd75syjcn46yb5ulttid.onion",
	"http://pliy7tiq6jf77gkg2sezlx7ljynkysxq6ptmfbfcdyrvihp7i6imyyqd.onion",
	"http://vu3miq3vhxljfclehmvy7ezclvsb3vksmug5vuivbpw4zovyszbemvqd.onion",
	"http://zwf5i7hiwmffq2bl7euedg6y5ydzze3ljiyrjmm7o42vhe7ni56fm7qd.onion",
	"http://7bw24ll47y7aohhkrfdq2wydg3zvuecvjo63muycjzlbaqlihuogqvyd.onion",
	"http://zkj7mzglnrbvu3elepazau7ol26cmq7acryvsqxvh4sreoydhzin7zid.onion",
	"http://f6wqhy6ii7metm45m4mg6yg76yytik5kxe6h7sestyvm6gnlcw3n4qad.onion",
	"http://ez37hmhem2gh3ixctfeaqn7kylal2vyjqsedkzhu4ebkcgikrigr5gid.onion",
	"http://bepig5bcjdhtlwpgeh3w42hffftcqmg7b77vzu7ponty52kiey5ec4ad.onion",
	"http://endtovmbc5vokdpnxrhajcwgkfbkfz4wbyhbj6ueisai4prtvencheyd.onion",
	"http://onili244aue7jkvzn2bgaszcb7nznkpyihdhh7evflp3iskfq7vhlzid.onion",
	"http://7wsvq2aw5ypduujgcn2zauq7sor2kqrqidguwwtersivfa6xcmdtaayd.onion",
	"http://hyjgsnkanan2wsrksd53na4xigtxhlz57estwqtptzhpa53rxz53pqad.onion",
	"http://awsvrc7occzj2yeyqevyrw7ji5ejuyofhfomidhh5qnuxpvwsucno7id.onion",
	"http://wosc4noitfscyywccasl3c4yu3lftpl2adxuvprp6sbg4fud6mkrwqqd.onion",
	"http://pz5uprzhnzeotviraa2fogkua5nlnmu75pbnnqu4fnwgfffldwxog7ad.onion",
	"http://jn6weomv6klvnwdwcgu55miabpwklsmmyaf5qrkt4miif4shrqmvdhqd.onion",
	"http://wms5y25kttgihs4rt2sifsbwsjqjrx3vtc42tsu2obksqkj7y666fgid.onion",
	"http://gkcns4d3453llqjrksxdijfmmdjpqsykt6misgojxlhsnpivtl3uwhqd.onion",
	"http://c5xoy22aadb2rqgw3jh2m2irmu563evukqqddu5zjandunaimzaye5id.onion",
	"http://rbcxodz4socx3rupvmhan2d7pvik4dpqmf4kexz6acyxbucf36a6ggid.onion",
	"http://7bw24ll47y7aohhkrfdq2wydg3zvuecvjo63muycjzlbaqlihuogqvyd.onion",
	"http://wges3aohuplu6he5tv4pn7sg2qaummlokimim6oaauqo2l7lbx4ufyyd.onion",
	"http://porf65zpwy2yo4sjvynrl4eylj27ibrmo5s2bozrhffie63c7cxqawid.onion",
	"http://hyxme2arc5jnevzlou547w2aaxubjm7mxhbhtk73boiwjxewawmrz6qd.onion",
	"http://6hzbfxpnsdo4bkplp5uojidkibswevsz3cfpdynih3qvfr24t5qlkcyd.onion",
	"http://gn74rz534aeyfxqf33hqg6iuspizulmvpd7zoyz7ybjq4jo3whkykryd.onion",
	"http://4p6i33oqj6wgvzgzczyqlueav3tz456rdu632xzyxbnhq4gpsriirtqd.onion",
	"http://dumlq77rikgevyimsj6e2cwfsueo7ooynno2rrvwmppngmntboe2hbyd.onion"
]


# ---- Enhanced Crawling Logic ----
def is_high_value(url, text):
    """Determine if content is high-value for threat intelligence"""
    text_lower = text.lower()
    url_lower = url.lower()
    
    # Check for keywords in URL or text
    keyword_matches = sum(
        1 for kw in THREAT_KEYWORDS 
        if kw in text_lower or kw in url_lower
    )
    
    # Check for patterns like cryptocurrency addresses
    crypto_addresses = re.findall(
        r'(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}|0x[a-fA-F0-9]{40}',
        text_lower
    )
    
    # Check for marketplace patterns
    has_price_list = bool(re.search(r'\$\d+\.\d{2}', text_lower))
    has_listings = 'product' in text_lower or 'listing' in text_lower
    
    return (
        keyword_matches >= 3 or 
        len(crypto_addresses) >= 1 or
        (has_price_list and has_listings)
    )

def crawl(url, depth=2):
    if depth == 0 or url in visited:
        return

    headers = {'User-Agent': random.choice(user_agents)}
    try:
        print(f"[+] Crawling: {url}")
        response = requests.get(url, headers=headers, proxies=proxies, timeout=20)
        visited.add(url)

        if response.status_code == 200:
            text_content = response.text.lower()
            
            # Only proceed if high-value content detected
            if is_high_value(url, text_content):
                # Save to DB if not already saved
                if collection.count_documents({'url': url}) == 0:
                    collection.insert_one({
                        'url': url,
                        'discovered': time.time(),
                        'last_checked': time.time(),
                        'status': 'active'
                    })
                    print(f"    └─ Saved HIGH-VALUE: {url}")

                if 'text/html' in response.headers.get('Content-Type', ''):
                    soup = BeautifulSoup(response.text, 'html.parser')
                    links = soup.find_all('a', href=True)

                    # Prioritize links containing keywords
                    priority_links = [
                        urljoin(url, l['href']) for l in links
                        if any(kw in l['href'].lower() for kw in THREAT_KEYWORDS)
                    ]
                    
                    # Also crawl regular links but with lower priority
                    for link in priority_links:
                        if link not in visited and '.onion' in link:
                            crawl(link, depth - 1)
                    
                    # Random sampling of other links
                    other_links = [
                        urljoin(url, l['href']) for l in links
                        if all(kw not in l['href'].lower() for kw in THREAT_KEYWORDS)
                        and '.onion' in l['href']
                    ]
                    for link in random.sample(other_links, min(3, len(other_links))):
                        if link not in visited:
                            crawl(link, depth - 1)

    except Exception as e:
        print(f"    └─ [!] Failed to crawl {url}: {e}")

# ---- Main ----
if __name__ == "__main__":
    authenticate_tor("Lalit@2003")

    random.shuffle(seed_urls)  # Randomize crawl order
    
    for seed in seed_urls:
        crawl(seed, depth=2)
        # Random delay between 10-30 seconds
        delay = random.uniform(10, 30)
        print(f"    └─ Waiting {delay:.1f} seconds...")
        time.sleep(delay)

    print("\n[✓] Crawling complete. High-value URLs saved to MongoDB.")
