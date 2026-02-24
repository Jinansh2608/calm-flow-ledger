import sys
sys.path.append('../Backend')
from app.database import get_db

conn = get_db()
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
tables = [r['table_name'] for r in cur.fetchall()]
print(tables)
