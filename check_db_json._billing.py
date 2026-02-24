import sys
import json
sys.path.append('../Backend')
from app.database import get_db

conn = get_db()
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='billing_po'")
cols = [c['column_name'] for c in cur.fetchall()]
with open('billing_po_cols.json', 'w') as f:
    json.dump(cols, f)
