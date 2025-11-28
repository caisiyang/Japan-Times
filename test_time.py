import time
import calendar
import datetime

# Simulate a UTC time from feedparser (e.g., 2025-11-28 00:00:00 UTC)
# This corresponds to 2025-11-28 09:00:00 JST
utc_struct = time.strptime("2025-11-28 00:00:00", "%Y-%m-%d %H:%M:%S")

# Current logic
timestamp_mktime = time.mktime(utc_struct)
print(f"UTC Struct: {utc_struct}")
print(f"mktime (Current Logic): {timestamp_mktime}")
print(f"Local time from mktime: {time.ctime(timestamp_mktime)}")

# Correct logic (assuming utc_struct is UTC)
timestamp_gmtime = calendar.timegm(utc_struct)
print(f"timegm (Correct Logic): {timestamp_gmtime}")
print(f"Local time from timegm: {time.ctime(timestamp_gmtime)}")

# Difference
diff = timestamp_gmtime - timestamp_mktime
print(f"Difference (seconds): {diff}")
print(f"Difference (hours): {diff / 3600}")
