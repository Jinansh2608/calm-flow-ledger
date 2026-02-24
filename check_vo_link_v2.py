import psycopg2
from psycopg2.extras import RealDictCursor

def check():
    try:
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            database="Nexgen_erp",
            user="postgres",
            password="toor",
            cursor_factory=RealDictCursor
        )
        with conn.cursor() as cur:
            cur.execute('SET search_path TO "Finances";')
            cur.execute("SELECT id, po_number, project_id FROM client_po WHERE po_number = '4100130800'")
            po = cur.fetchone()
            print(f"PO Data: {po}")
            
            if po and po['project_id']:
                cur.execute("SELECT id, name FROM project WHERE id = %s", (po['project_id'],))
                print(f"Linked Project: {cur.fetchone()}")
                
                cur.execute("SELECT id, vendor_id, project_id, po_number, amount FROM vendor_order WHERE project_id = %s", (po['project_id'],))
                vos = cur.fetchall()
                print(f"Vendor Orders for Project {po['project_id']}: {len(vos)}")
                for vo in vos:
                    print(vo)
            else:
                print("PO project_id is None or PO not found.")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
