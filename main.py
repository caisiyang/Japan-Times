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
    # 修复：加 sort=date 强制按时间倒序；when:1d 保持过去24小时
    url = "https://news.google.com/rss/search?q=中国+when:1d&hl=ja&gl=JP&ceid=JP:ja&sort=date"
    feed = feedparser.parse(url)
    
    entries = []
    # 去掉 cutoff 过滤，用 RSS 的 1d 限制；只取有时间戳的
    for entry in feed.entries[:200]:
        if hasattr(entry, 'published_parsed') and entry.published_parsed:
            pub_time = time.mktime(entry.published_parsed)
            entries.append((pub_time, entry))
    
    # 按时间倒序（最新在前）
    entries.sort(key=lambda x: x[0], reverse=True)
    print(f"RSS 返回 {len(entries)} 条新闻（过去24小时）")
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
    
    # 读取今日已有
    today_list = []
    if os.path.exists(archive_path):
        with open(archive_path, 'r', encoding='utf-8') as f:
            today_list = json.load(f)
    
    # 去重：用链接判断，避免重复
    existing_links = {item['link'] for item in today_list}
    added_count = 0
    for item in new_data:
        if item['link'] not in existing_links:
            today_list.append(item)  # append 而非 insert(0)，后面统一 sort
            existing_links.add(item['link'])
            added_count += 1
    
    # 修复：统一按时间戳倒序排序（最新在前）
    today_list.sort(key=lambda x: x['timestamp'], reverse=True)
    
    with open(archive_path, 'w', encoding='utf-8') as f:
        json.dump(today_list, f, ensure_ascii=False, indent=2)
    
    # 生成首页 data.json：取所有存档的最新 100 条（跨天，确保最新在前）
    home_data = []
    seen_links = set()
    today = get_current_jst_time()
    
    for i in range(30):  # 最近 30 天
        date = (today - datetime.timedelta(days=i)).strftime("%Y-%m-%d")
        path = os.path.join(archive_dir, f"{date}.json")
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                day_data = json.load(f)
                # 取该天的最新条目，追加到 home_data（但限 100 条总和）
                day_data.sort(key=lambda x: x['timestamp'], reverse=True)
                for item in day_data:
                    if item['link'] not in seen_links and len(home_data) < 100:
                        home_data.append(item)
                        seen_links.add(item['link'])
    
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(home_data, f, ensure_ascii=False, indent=2)
    
    print(f"更新完成！今日总 {len(today_list)} 条，本次新增 {added_count} 条，首页最新 {len(home_data)} 条（跨天）")
    # 打印最新 3 条时间，方便日志确认
    if today_list:
        print("今日最新 3 条时间：")
        for item in today_list[:3]:
            print(f"- {item['time_str']}：{item['title'][:50]}")

if __name__ == "__main__":
    update_news()