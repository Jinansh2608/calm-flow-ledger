import sys
sys.path.append('../Backend')
from app.database import get_db

conn = get_db()
cur = conn.cursor()
cur.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%vendor%'")
for r in cur.fetchall():
    print(dict(r))
