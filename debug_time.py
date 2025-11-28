import datetime
import calendar
import time

JST = datetime.timezone(datetime.timedelta(hours=9))

ts = 1764320400.0
dt = datetime.datetime.fromtimestamp(ts, JST)
print(f"Timestamp: {ts}")
print(f"DT (JST): {dt}")
print(f"Str: {dt.strftime('%m-%d %H:%M')}")

# Check what 09:00 JST would be
dt_target = datetime.datetime(2025, 11, 28, 9, 0, 0, tzinfo=JST)
print(f"Target DT (09:00 JST): {dt_target}")
print(f"Target Timestamp: {dt_target.timestamp()}")
