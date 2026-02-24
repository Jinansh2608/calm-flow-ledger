import sys; sys.path.append(r'..\Backend')
from app.database import get_db
conn = get_db()
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'client_po';")
print(", ".join([r['column_name'] for r in cur.fetchall()]))
