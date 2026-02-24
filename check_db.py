import sys
sys.path.append('../Backend')
from app.database import get_db

conn = get_db()
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='vendor_order'")
cols = cur.fetchall()
print("Vendor Order Columns:")
for c in cols:
    print(c)
