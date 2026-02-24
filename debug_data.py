import sys
import os
# Adjust path to find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../Backend')))

try:
    from app.database import get_db
except ImportError:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'Backend')))
    from app.database import get_db

conn = get_db()
cur = conn.cursor()

with open('db_dump.txt', 'w') as f:
    f.write("--- PROJECTS ---\n")
    cur.execute("SELECT id, name FROM project ORDER BY id DESC")
    projects = cur.fetchall()
    for p in projects:
        f.write(f"ID: {p['id']}, Name: '{p['name']}'\n")

    f.write("\n--- CLIENT POs (Last 20) ---\n")
    cur.execute("""
        SELECT 
            cp.id, 
            cp.po_number, 
            cp.project_id, 
            p.name as project_name, 
            cp.client_id, 
            c.name as client_name
        FROM client_po cp
        LEFT JOIN project p ON cp.project_id = p.id
        LEFT JOIN client c ON cp.client_id = c.id
        ORDER BY cp.id DESC
        LIMIT 20
    """)
    pos = cur.fetchall()
    for po in pos:
        f.write(f"ID: {po['id']}, PO: '{po['po_number']}', ProjID: {po['project_id']}, ProjName: '{po['project_name']}', Client: '{po['client_name']}'\n")

conn.close()
print("Dump complete -> db_dump.txt")
