import json
import os
import glob
from deep_translator import GoogleTranslator
import time

def migrate_data():
    translator = GoogleTranslator(source='ja', target='zh-TW')
    
    # 1. Migrate data.json
    print("Migrating data.json...")
    if os.path.exists('data.json'):
        with open('data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        updated_count = 0
        if 'news' in data:
            for item in data['news']:
                if 'title_tc' not in item:
                    try:
                        # Translate from Japanese title if available, else use title (SC)
                        source_text = item.get('title_ja', item.get('title', ''))
                        if source_text:
                            item['title_tc'] = translator.translate(source_text)
                            updated_count += 1
                        else:
                            print("Skipping item with no title")
                    except Exception as e:
                        print(f"Error translating: {e}")
                        item['title_tc'] = item.get('title', '') # Fallback to SC
            
            if updated_count > 0:
                with open('data.json', 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f"Updated {updated_count} items in data.json")
            else:
                print("No items needed update in data.json")

    # 2. Migrate archive files
    print("Migrating archive files...")
    archive_files = glob.glob('archive/*.json')
    for file_path in archive_files:
        print(f"Processing {file_path}...")
        with open(file_path, 'r', encoding='utf-8') as f:
            items = json.load(f)
        
        file_updated_count = 0
        for item in items:
            if 'title_tc' not in item:
                try:
                    source_text = item.get('title_ja', item.get('title', ''))
                    if source_text:
                        item['title_tc'] = translator.translate(source_text)
                        file_updated_count += 1
                except Exception as e:
                    print(f"Error translating in {file_path}: {e}")
                    item['title_tc'] = item.get('title', '')
        
        if file_updated_count > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(items, f, ensure_ascii=False, indent=2)
            print(f"Updated {file_updated_count} items in {file_path}")
        else:
            print(f"No items needed update in {file_path}")

if __name__ == "__main__":
    migrate_data()
