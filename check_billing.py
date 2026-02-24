import sys
import json
sys.path.append('../Backend')
from app.database import get_db

conn = get_db()
cur = conn.cursor()
tables = ['billing_po', 'billing_po_line_item']
output = {}
for t in tables:
    cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name='{t}'")
    output[t] = [c['column_name'] for c in cur.fetchall()]

with open('billing.json', 'w') as f:
    json.dump(output, f, indent=2)
