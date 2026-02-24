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
            if po:
                print(f"PO_ID: {po['id']}")
                print(f"PO_NUMBER: {po['po_number']}")
                print(f"PROJECT_ID: {po['project_id']}")
                
                if po['project_id']:
                    cur.execute("SELECT id, name FROM project WHERE id = %s", (po['project_id'],))
                    proj = cur.fetchone()
                    print(f"PROJECT_NAME: {proj['name'] if proj else 'N/A'}")
                    
                    cur.execute("SELECT id, vendor_id, po_number, amount FROM vendor_order WHERE project_id = %s", (po['project_id'],))
                    vos = cur.fetchall()
                    print(f"VO_COUNT: {len(vos)}")
                    for vo in vos:
                        print(f"VO: ID={vo['id']}, PO={vo['po_number']}, AMT={vo['amount']}")

        conn.close()
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    check()
