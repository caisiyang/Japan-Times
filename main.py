import feedparser
from deep_translator import GoogleTranslator
import json
import os
import datetime
import time

# 设置时区为 UTC+9 (日本时间)
# GitHub Actions 服务器通常是 UTC+0，所以我们需要 +9
JST_OFFSET = datetime.timedelta(hours=9)

RSS_URL = "https://news.yahoo.co.jp/rss/topics/top-picks.xml"

def get_current_jst_time():
    return datetime.datetime.utcnow() + JST_OFFSET

def update_news():
    print("🚀 开始抓取 Yahoo Japan RSS...")
    try:
        feed = feedparser.parse(RSS_URL)
    except Exception as e:
        print(f"❌ RSS抓取失败: {e}")
        return

    translator = GoogleTranslator(source='auto', target='zh-CN')
    
    news_data = []
    
    # 抓取前 15 条
    for entry in feed.entries[:15]:
        try:
            # 翻译标题
            zh_title = translator.translate(entry.title)
        except:
            zh_title = entry.title
        
        # 提取发布时间 (尝试解析 RSS 的时间，如果失败则用当前时间)
        try:
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                # 转换为 JST 时间显示
                published_utc = datetime.datetime(*entry.published_parsed[:6])
                published_jst = published_utc # Yahoo RSS通常已经是时区调整过的，或者我们只取时分
                time_str = published_jst.strftime("%H:%M")
            else:
                time_str = get_current_jst_time().strftime("%H:%M")
        except:
            time_str = get_current_jst_time().strftime("%H:%M")

        news_data.append({
            "title": zh_title,
            "origin": entry.title,
            "link": entry.link,
            "time": time_str
        })
        # 稍微暂停防封
        time.sleep(0.5)

    if not news_data:
        print("⚠️ 未获取到任何新闻数据")
        return

    # --- 1. 保存今日最新数据 (供首页默认显示) ---
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(news_data, f, ensure_ascii=False, indent=2)
    print("✅ data.json 更新成功")

    # --- 2. 保存历史存档 (archive/YYYY-MM-DD.json) ---
    # 确保 archive 文件夹存在
    archive_dir = "archive"
    if not os.path.exists(archive_dir):
        os.makedirs(archive_dir)
    
    # 获取日本时间的日期字符串 (例如 2023-11-28)
    date_str = get_current_jst_time().strftime("%Y-%m-%d")
    archive_path = os.path.join(archive_dir, f"{date_str}.json")

    # 写入存档
    with open(archive_path, 'w', encoding='utf-8') as f:
        json.dump(news_data, f, ensure_ascii=False, indent=2)
    print(f"✅ 历史存档已更新: {archive_path}")

if __name__ == "__main__":
    update_news()