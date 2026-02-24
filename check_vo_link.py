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
            print(f"PO Data: {cur.fetchone()}")
            
            cur.execute("SELECT p.id, p.name FROM project p JOIN client_po cp ON cp.project_id = p.id WHERE cp.po_number = '4100130800'")
            print(f"Linked Project: {cur.fetchone()}")
            
            cur.execute("SELECT id, vendor_id, project_id, po_number, amount FROM vendor_order WHERE project_id = (SELECT project_id FROM client_po WHERE po_number = '4100130800')")
            print("Vendor Orders for this Project:")
            for vo in cur.fetchall():
                print(vo)
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
