import feedparser
from deep_translator import GoogleTranslator
import json
import os
import datetime
import time
import requests  # 引入 requests 库来做伪装

# 设置时区 UTC+9
JST_OFFSET = datetime.timedelta(hours=9)

RSS_URL = "https://news.yahoo.co.jp/rss/ranking/comment/all.xml"

def get_current_jst_time():
    return datetime.datetime.utcnow() + JST_OFFSET

def update_news():
    print("🚀 开始抓取 Yahoo 评论排行榜...")
    
    # --- 🔥 核心修改：伪装成浏览器 ---
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        # 先用 requests 带着伪装头去请求
        response = requests.get(RSS_URL, headers=headers, timeout=10)
        # 打印状态码，方便调试 (200表示成功，403表示被拒)
        print(f"📡 Yahoo 响应状态码: {response.status_code}")
        
        if response.status_code != 200:
            print("❌ 访问被拒绝，可能IP被封锁")
            return

        # 把请求到的内容喂给 feedparser
        feed = feedparser.parse(response.content)
        
    except Exception as e:
        print(f"❌ 网络请求失败: {e}")
        return
    # ----------------------------------

    if not feed.entries:
        print("⚠️ 获取到的 RSS 内容为空，请检查网络或源")
        return

    translator = GoogleTranslator(source='auto', target='zh-CN')
    
    archive_dir = "archive"
    if not os.path.exists(archive_dir):
        os.makedirs(archive_dir)
        
    date_str = get_current_jst_time().strftime("%Y-%m-%d")
    archive_path = os.path.join(archive_dir, f"{date_str}.json")
    
    existing_links = set()
    current_archive_data = []

    if os.path.exists(archive_path):
        try:
            with open(archive_path, 'r', encoding='utf-8') as f:
                current_archive_data = json.load(f)
                for item in current_archive_data:
                    existing_links.add(item['link'])
        except:
            pass

    new_items_count = 0
    
    for entry in feed.entries[:15]:
        link = entry.link
        if link in existing_links:
            continue

        try:
            zh_title = translator.translate(entry.title)
        except:
            zh_title = entry.title
        
        image_url = ""
        if 'media_thumbnail' in entry and len(entry.media_thumbnail) > 0:
            image_url = entry.media_thumbnail[0]['url']
        elif 'links' in entry:
            for l in entry.links:
                if 'image' in l.get('type', ''):
                    image_url = l['href']
                    break
        
        time_str = get_current_jst_time().strftime("%H:%M")

        item_data = {
            "title": zh_title,
            "origin": entry.title,
            "link": link,
            "time": time_str,
            "image": image_url
        }
        
        current_archive_data.insert(0, item_data)
        existing_links.add(link)
        new_items_count += 1
        time.sleep(0.5)

    print(f"✅ 新增了 {new_items_count} 条新闻")

    with open(archive_path, 'w', encoding='utf-8') as f:
        json.dump(current_archive_data, f, ensure_ascii=False, indent=2)
    print(f"✅ 历史存档已更新: {archive_path}")

    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(current_archive_data[:20], f, ensure_ascii=False, indent=2)
    print("✅ data.json 更新成功")

if __name__ == "__main__":
    update_news()