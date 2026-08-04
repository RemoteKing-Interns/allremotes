import json
from collections import Counter

path = r"C:\Users\Ajay\Downloads\product_content_google_log (1).jsonl"
ids = set()
ids_success = set()
ids_updated = set()
errors = 0
total = 0
success_counts = Counter()
update_counts = Counter()

with open(path, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        total += 1
        try:
            obj = json.loads(line)
        except Exception:
            errors += 1
            continue
        pid = obj.get("product_id") or obj.get("id")
        if pid:
            ids.add(pid)

        success = obj.get("success")
        success_counts[success] += 1
        if success:
            ids_success.add(pid)

        update_info = obj.get("update_info")
        if isinstance(update_info, dict):
            ok = update_info.get("updated")
            update_counts[ok] += 1
            if ok:
                ids_updated.add(pid)
        else:
            update_counts[str(update_info)[:80]] += 1

print(f"Total log entries: {total}")
print(f"Unique product ids in log: {len(ids)}")
print(f"Parse errors: {errors}")
print(f"success value counts: {dict(success_counts)}")
print(f"Unique product ids with success=True: {len(ids_success)}")
print(f"update_info ok counts: {dict(update_counts)}")
print(f"Unique product ids with update_info ok=True: {len(ids_updated)}")

# Show the first few entries to inspect structure
print("\nFirst 3 entries:")
with open(path, "r", encoding="utf-8") as f:
    shown = 0
    for line in f:
        line = line.strip()
        if not line:
            continue
        obj = json.loads(line)
        print(f"  product_id={obj.get('product_id')} success={obj.get('success')} update_info={type(obj.get('update_info')).__name__} {str(obj.get('update_info'))[:200]}")
        shown += 1
        if shown >= 3:
            break
