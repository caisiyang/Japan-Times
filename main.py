import feedparser
from deep_translator import GoogleTranslator
import json
import os
import datetime
import time

# 设置时区 UTC+9
JST_OFFSET = datetime.timedelta(hours=9)

# 改用 Yahoo 评论排行榜 RSS (热度最高)
RSS_URL = "https://news.yahoo.co.jp/rss/ranking/comment/all.xml"

def get_current_jst_time():
    return datetime.datetime.utcnow() + JST_OFFSET

def update_news():
    print("🚀 开始抓取 Yahoo 评论排行榜...")
    try:
        feed = feedparser.parse(RSS_URL)
    except Exception as e:
        print(f"❌ RSS抓取失败: {e}")
        return

    translator = GoogleTranslator(source='auto', target='zh-CN')
    
    # 1. 读取今日已有的存档（为了去重）
    archive_dir = "archive"
    if not os.path.exists(archive_dir):
        os.makedirs(archive_dir)
        
    date_str = get_current_jst_time().strftime("%Y-%m-%d")
    archive_path = os.path.join(archive_dir, f"{date_str}.json")
    
    existing_links = set()
    current_archive_data = []

    # 如果今天已经有存档，先读出来
    if os.path.exists(archive_path):
        try:
            with open(archive_path, 'r', encoding='utf-8') as f:
                current_archive_data = json.load(f)
                for item in current_archive_data:
                    existing_links.add(item['link'])
        except:
            print("⚠️ 读取旧存档失败，将创建新存档")

    # 2. 处理新抓取的数据
    new_items_count = 0
    
    # 我们只看 RSS 的前 15 条（热度最高的）
    for entry in feed.entries[:15]:
        link = entry.link
        
        # 去重：如果这个链接今天已经存过了，就跳过
        if link in existing_links:
            continue

        try:
            zh_title = translator.translate(entry.title)
        except:
            zh_title = entry.title
        
        # 尝试提取图片 (Yahoo RSS 格式不定，尝试几种常见字段)
        image_url = ""
        # 1. 尝试 media_thumbnail
        if 'media_thumbnail' in entry and len(entry.media_thumbnail) > 0:
            image_url = entry.media_thumbnail[0]['url']
        # 2. 尝试 links 中的 image 类型
        elif 'links' in entry:
            for l in entry.links:
                if 'image' in l.get('type', ''):
                    image_url = l['href']
                    break
        
        # 获取时间
        time_str = get_current_jst_time().strftime("%H:%M")

        item_data = {
            "title": zh_title,
            "origin": entry.title,
            "link": link,
            "time": time_str,
            "image": image_url  # 新增图片字段
        }
        
        # 添加到列表头部（最新的排前面）
        current_archive_data.insert(0, item_data)
        existing_links.add(link)
        new_items_count += 1
        
        # 稍微延时
        time.sleep(0.5)

    print(f"✅ 新增了 {new_items_count} 条新闻")

    # 3. 保存今日存档 (包含之前和新增的)
    with open(archive_path, 'w', encoding='utf-8') as f:
        json.dump(current_archive_data, f, ensure_ascii=False, indent=2)
    print(f"✅ 历史存档已更新: {archive_path}")

    # 4. 更新首页 data.json (只显示存档里最新的 20 条，保持首页精简)
    # 首页数据直接用今天的存档即可
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(current_archive_data[:20], f, ensure_ascii=False, indent=2)
    print("✅ data.json 更新成功")

if __name__ == "__main__":
    update_news()