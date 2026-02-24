import sys
sys.path.append('../Backend')
from app.database import get_db

conn = get_db()
cur = conn.cursor()
cur.execute("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='Finances'")
schema = {}
for row in cur.fetchall():
    t = row['table_name']
    c = row['column_name']
    if t not in schema:
        schema[t] = []
    schema[t].append(c)

import json
with open('finances_schema.json', 'w') as f:
    json.dump(schema, f, indent=2)
