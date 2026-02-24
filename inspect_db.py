import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../Backend')))

try:
    from app.database import get_db
except ImportError:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'Backend')))
    from app.database import get_db

conn = get_db()
cur = conn.cursor()

def print_table_info(table_name):
    print(f"\n--- {table_name} Columns ---")
    cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table_name}'")
    for col in cur.fetchall():
        print(f"{col['column_name']} ({col['data_type']})")

print_table_info('project')
print_table_info('client_po')

print("\n--- Project Data (Last 5) ---")
cur.execute("SELECT * FROM project ORDER BY id DESC LIMIT 5")
for row in cur.fetchall():
    print(row)

print("\n--- Client PO Data (Last 5) ---")
cur.execute("SELECT * FROM client_po ORDER BY id DESC LIMIT 5")
for row in cur.fetchall():
    print(row)

conn.close()
