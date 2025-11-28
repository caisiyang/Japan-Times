import feedparser
from deep_translator import GoogleTranslator
import json
import os
import datetime
import time
from bs4 import BeautifulSoup

# 日本时间
JST_OFFSET = datetime.timedelta(hours=9)
def get_current_jst_time():
    return datetime.datetime.utcnow() + JST_OFFSET

def extract_image(entry):
    content = entry.get('summary', '') or entry.get('description', '') or entry.get('content', '')
    if content:
        try:
            soup = BeautifulSoup(content, 'html.parser')
            img = soup.find('img')
            if img and img.get('src'):
                return img['src']
        except:
            pass
    return ""

def classify_news(title):
    keywords = {
        "时政": ["政府", "习近平", "外交", "台湾", "军事", "国防", "中共", "首相", "特朗普", "制裁", "大使", "峰会", "钓鱼岛", "尖阁"],
        "经济": ["经济", "贸易", "股市", "企业", "GDP", "消费", "半导体", "关税", "出口", "华为", "比亚迪", "财报"],
        "社会": ["社会", "犯罪", "疫情", "旅游", "签证", "移民", "少子化", "地震", "台风", "熊猫"],
        "体育": ["体育", "奥运", "足球", "大谷", "羽生", "乒乓"],
        "科技": ["科技", "AI", "芯片", "航天", "机器人", "5G", "量子", "电池"],
        "娱乐": ["娱乐", "电影", "动漫", "声优", "偶像", "吉卜力", "鬼灭"]
    }
    for cat, words in keywords.items():
        if any(w in title for w in words):
            return cat
    return "其他"

def fetch_google_china_news():
    print("正在抓取最新日本媒体中国新闻...")
    # 关键修复：强制按时间排序 + 限制最近8小时（避免抓太多旧新闻）
    url = "https://news.google.com/rss/search?q=中国&hl=ja&gl=JP&ceid=JP:ja&sort=date"
    feed = feedparser.parse(url)
    
    entries = []
    cutoff = time.time() - 8 * 3600  # 只取最近8小时的，防止抓到几天前的
    
    for entry in feed.entries[:200]:  # 最多200条
        if hasattr(entry, 'published_parsed') and entry.published_parsed:
            pub_time = time.mktime(entry.published_parsed)
            if pub_time < cutoff:
                continue
            entries.append((pub_time, entry))
    
    # 按时间倒序排序
    entries.sort(key=lambda x: x[0], reverse=True)
    return [e[1] for e in entries]

def process_entries(entries):
    data = []
    translator = GoogleTranslator(source='ja', target='zh-CN')
    
    for entry in entries:
        title_ja = entry.title
        link = entry.link
        published = entry.published_parsed
        timestamp = time.mktime(published)
        time_str = time.strftime("%m-%d %H:%M", time.localtime(timestamp))
        
        try:
            title_zh = translator.translate(title_ja)
        except:
            title_zh = title_ja
        
        image = extract_image(entry)
        category = classify_news(title_zh)
        
        data.append({
            "title": title_zh,
            "link": link,
            "image": image,
            "summary": "",
            "category": category,
            "time_str": time_str,
            "timestamp": timestamp,
            "origin": entry.source.title if hasattr(entry, 'source') else "Google News"
        })
    return data

def update_news():
    entries = fetch_google_china_news()
    new_data = process_entries(entries)
    
    archive_dir = "archive"
    os.makedirs(archive_dir, exist_ok=True)
    today_str = get_current_jst_time().strftime("%Y-%m-%d")
    archive_path = os.path.join(archive_dir, f"{today_str}.json")
    
    # 读取今日已有 + 去重合并 + 强制时间排序
    today_list = []
    if os.path.exists(archive_path):
        with open(archive_path, 'r', encoding='utf-8') as f:
            today_list = json.load(f)
    
    existing = {item['link'] for item in today_list}
    for item in new_data:
        if item['link'] not in existing:
            today_list.append(item)
            existing.add(item['link'])
    
    # 关键：最终按时间戳倒序
    today_list.sort(key=lambda x: x['timestamp'], reverse=True)
    
    with open(archive_path, 'w', encoding='utf-8') as f:
        json.dump(today_list, f, ensure_ascii=False, indent=2)
    
    # 生成首页 data.json（最近100条）
    home_data = []
    seen = set()
    today = get_current_jst_time()
    
    for i in range(30):
        date = (today - datetime.timedelta(days=i)).strftime("%Y-%m-%d")
        path = os.path.join(archive_dir, f"{date}.json")
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                day_data = json.load(f)
                for item in day_data:
                    if item['link'] not in seen and len(home_data) < 100:
                        home_data.append(item)
                        seen.add(item['link'])
    
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(home_data, f, ensure_ascii=False, indent=2)
    
    print(f"更新完成！今日 {len(today_list)} 条，新增 {len(new_data)} 条，首页显示 {len(home_data)} 条")

if __name__ == "__main__":
    update_news()