import feedparser
from deep_translator import GoogleTranslator
import json
import os
import datetime
import time
import requests
from bs4 import BeautifulSoup

# 设置时区 UTC+9
JST_OFFSET = datetime.timedelta(hours=9)

def get_current_jst_time():
    return datetime.datetime.utcnow() + JST_OFFSET

# --- 图片提取逻辑 ---
def extract_image(entry):
    # 1. Bing 的 media_content / media_thumbnail
    if 'media_content' in entry:
        for media in entry.media_content:
            if 'image' in media.get('type', '') or 'medium' in media:
                return media.get('url', '')
    if 'media_thumbnail' in entry and len(entry.media_thumbnail) > 0:
        return entry.media_thumbnail[0].get('url', '')

    # 2. Bing/Google 的 links
    if 'links' in entry:
        for link in entry.links:
            if link.get('type', '').startswith('image/'):
                return link.get('href', '')

    # 3. HTML 内容提取 (Google News 必备)
    content_html = ""
    if 'summary' in entry:
        content_html = entry.summary
    elif 'description' in entry:
        content_html = entry.description
    
    if content_html:
        try:
            soup = BeautifulSoup(content_html, 'html.parser')
            img = soup.find('img')
            if img and 'src' in img.attrs:
                return img['src']
        except:
            pass
    return ""

def fetch_feed(source_type, url):
    print(f"🚀 正在抓取 [{source_type}] ...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            print(f"❌ [{source_type}] 请求被拒绝: {response.status_code}")
            return []
        
        feed = feedparser.parse(response.content)
        if not feed.entries:
            print(f"⚠️ [{source_type}] RSS 解析成功但无内容")
            return []
            
        print(f"✅ [{source_type}] 获取到 {len(feed.entries)} 条原始数据")
        return feed.entries
    except Exception as e:
        print(f"❌ [{source_type}] 网络/解析错误: {e}")
        return []

def process_entries(entries, category_label):
    processed = []
    translator = GoogleTranslator(source='auto', target='zh-CN')
    
    # 限制抓取数量
    limit = 20 if category_label == "china" else 15
    
    for entry in entries[:limit]:
        original_title = entry.title
        
        # --- 来源提取 ---
        # Google News 的标题通常是 "标题 - 媒体名"
        # 我们把媒体名提取出来，为了证明这是日本媒体
        media_name = ""
        clean_title = original_title
        if ' - ' in original_title:
            parts = original_title.rsplit(' - ', 1)
            clean_title = parts[0]
            media_name = parts[1]
        elif 'source' in entry:
            media_name = entry.source.title

        # 1. 翻译标题
        try:
            zh_title = translator.translate(clean_title)
        except:
            zh_title = clean_title 

        # 2. 提取图片
        image_url = extract_image(entry)
        
        # Bing图片修复 (去除缩放参数拿原图)
        if 'bing.net' in image_url or 'th?id=' in image_url:
            if '&w=' in image_url:
                image_url = image_url.split('&w=')[0]

        time_str = get_current_jst_time().strftime("%H:%M")
        
        # 构造显示用的来源字符串
        origin_display = original_title
        if media_name:
            # 这里的目的是让用户在界面上看到 [NHK] 这样的字样
            # 我们不修改 origin 字段的存储，但在前端可能需要留意，或者直接存入 origin
            # 这里简单处理，直接把原文标题设为包含来源的
            pass 

        item = {
            "title": zh_title,
            "origin": original_title, # 保留包含媒体名的完整标题
            "link": entry.link,
            "time": time_str,
            "image": image_url
        }
        processed.append(item)
        time.sleep(0.2)
        
    return processed

def update_news():
    # --- 1. 定义源 ---
    # 日本热搜 (Bing): 稳定，带图
    BING_HOT_URL = "https://www.bing.com/news/search?q=&format=rss&cc=JP"
    
    # 中国相关 (Google News 日本版): 
    # hl=ja (日语)
    # gl=JP (日本地区)
    # ceid=JP:ja (强制使用日本版引擎 -> 关键！这保证了来源都是日本媒体)
    # 去掉了 when:1d 以保证有数据
    GOOGLE_CHINA_URL = "https://news.google.com/rss/search?q=中国&hl=ja&gl=JP&ceid=JP:ja"

    # --- 2. 抓取 ---
    raw_hot = fetch_feed("日本热搜(Bing)", BING_HOT_URL)
    raw_china = fetch_feed("中国相关(Google)", GOOGLE_CHINA_URL)

    # --- 3. 处理 ---
    hot_data = process_entries(raw_hot, "hot")
    china_data = process_entries(raw_china, "china")

    # --- 4. 读写存档 ---
    archive_dir = "archive"
    if not os.path.exists(archive_dir):
        os.makedirs(archive_dir)
    
    date_str = get_current_jst_time().strftime("%Y-%m-%d")
    archive_path = os.path.join(archive_dir, f"{date_str}.json")
    
    final_data = { "hot": [], "china": [] }

    # 读取并合并
    if os.path.exists(archive_path):
        try:
            with open(archive_path, 'r', encoding='utf-8') as f:
                old = json.load(f)
                if isinstance(old, dict):
                    final_data = old
        except:
            pass

    def merge(old_list, new_list):
        seen = set(i['link'] for i in old_list)
        for item in new_list:
            if item['link'] not in seen:
                old_list.insert(0, item)
        return old_list[:40]

    final_data['hot'] = merge(final_data.get('hot', []), hot_data)
    final_data['china'] = merge(final_data.get('china', []), china_data)

    print(f"✅ 最终入库: 热搜 {len(final_data['hot'])} 条, 中国 {len(final_data['china'])} 条")

    # 写入
    with open(archive_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    print("✅ data.json 更新完毕")

if __name__ == "__main__":
    update_news()