import os
import json
from googleapiclient.discovery import build
import datetime
import boto3
from botocore.config import Config

# -------------------------------------------------------------
# Configuration
# -------------------------------------------------------------
yt_token = os.environ.get("YOUTUBE_" + "API_KEY")
CONFIG_FILE = "scripts/stream_config.json"
OUTPUT_FILE = "public/live_data.json"

# === R2 配置 ===
R2_ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
R2_ACCESS_KEY = os.environ.get("CLOUDFLARE_R2_ACCESS_KEY_ID", "")
R2_SECRET_KEY = os.environ.get("CLOUDFLARE_R2_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "cnjp-data")

def get_r2_client():
    """获取 R2 客户端"""
    if not R2_ACCOUNT_ID or not R2_ACCESS_KEY or not R2_SECRET_KEY:
        print("⚠️ R2 credentials not configured, skipping R2 upload")
        return None
    
    return boto3.client(
        's3',
        endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )

def upload_to_r2(client, local_path, r2_key):
    """上传文件到 R2"""
    if client is None:
        return False
    try:
        with open(local_path, 'rb') as f:
            client.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=r2_key,
                Body=f.read(),
                ContentType='application/json'
            )
        print(f"✅ Uploaded to R2: {r2_key}")
        return True
    except Exception as e:
        print(f"❌ R2 upload failed for {r2_key}: {e}")
        return False

def load_stream_config():
    """加载直播源配置"""
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def calculate_match_score(title, keywords):
    """
    计算标题的匹配分数，包含的关键词越多分数越高
    """
    score = 0
    title_lower = title.lower()
    
    for keyword in keywords:
        if keyword.lower() in title_lower:
            score += 1
    
    return score

def get_live_stream_for_channel(youtube, channel_id, keywords, channel_name):
    """
    获取指定频道的直播源
    """
    try:
        print(f"\n🔍 Searching channel: {channel_name} ({channel_id})")
        print(f"   Keywords: {keywords}")
        
        # 搜索该频道的所有直播
        request = youtube.search().list(
            part="id,snippet",
            channelId=channel_id,
            eventType="live",
            type="video",
            maxResults=50
        )
        response = request.execute()
        items = response.get("items", [])

        if not items:
            print(f"   ⚠️ No live streams found")
            return None

        print(f"   📺 Found {len(items)} active streams")
        
        # 为每个视频计算匹配分数
        scored_videos = []
        for video in items:
            title = video["snippet"]["title"]
            video_id = video["id"]["videoId"]
            score = calculate_match_score(title, keywords)
            
            scored_videos.append({
                "title": title,
                "video_id": video_id,
                "score": score
            })

        # 按分数排序
        scored_videos.sort(key=lambda x: x["score"], reverse=True)
        best_match = scored_videos[0]
        
        if best_match["score"] > 0:
            print(f"   ✅ Best match (score {best_match['score']}): {best_match['title'][:60]}...")
        else:
            print(f"   ⚠️ No keyword match, using first available: {best_match['title'][:60]}...")
        
        return {
            "videoId": best_match["video_id"],
            "title": best_match["title"],
            "matchScore": best_match["score"]
        }
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None

def update_all_streams(api_key):
    """
    更新所有直播源
    """
    config = load_stream_config()
    youtube = build("youtube", "v3", developerKey=api_key)
    
    results = {
        "lastUpdated": datetime.datetime.now().isoformat(),
        "streams": []
    }
    
    print("=" * 80)
    print("🚀 Updating all live streams...")
    print("=" * 80)
    
    for stream_config in config["streams"]:
        stream_id = stream_config["id"]
        display_name = stream_config["displayName"]
        channel_id = stream_config["channelId"]
        channel_name = stream_config["channelName"]
        keywords = stream_config["keywords"]
        
        stream_data = get_live_stream_for_channel(
            youtube, 
            channel_id, 
            keywords, 
            channel_name
        )
        
        if stream_data:
            results["streams"].append({
                "id": stream_id,
                "displayName": display_name,
                "channelName": channel_name,
                "isLive": True,
                "videoId": stream_data["videoId"],
                "title": stream_data["title"],
                "matchScore": stream_data["matchScore"]
            })
        else:
            # 没有找到直播，标记为离线
            results["streams"].append({
                "id": stream_id,
                "displayName": display_name,
                "channelName": channel_name,
                "isLive": False,
                "videoId": None,
                "title": None,
                "matchScore": 0
            })
    
    return results

def save_to_json(data, filename):
    """保存数据到 JSON 文件并上传到 R2"""
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("\n" + "=" * 80)
    print(f"💾 Data saved to {filename}")
    
    # 上传到 R2
    r2_client = get_r2_client()
    if r2_client:
        upload_to_r2(r2_client, filename, "live_data.json")
    
    print("=" * 80)
    print("\n📊 Summary:")
    for stream in data["streams"]:
        status = "🟢 LIVE" if stream["isLive"] else "🔴 OFFLINE"
        print(f"  {status} {stream['displayName']}")
        if stream["isLive"]:
            print(f"       Video ID: {stream['videoId']}")
    print("=" * 80)

if __name__ == "__main__":
    if not yt_token:
        raise ValueError("❌ Error: Missing YouTube API key!")
    
    try:
        data = update_all_streams(yt_token)
        save_to_json(data, OUTPUT_FILE)
        print("\n✨ Done.")
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        raise