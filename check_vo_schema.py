import psycopg2
from psycopg2.extras import RealDictCursor

def check_schema():
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
            cur.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'vendor_order' 
                AND table_schema = 'Finances'
            """)
            print("Columns in vendor_order:")
            for col in cur.fetchall():
                print(f"- {col['column_name']} ({col['data_type']})")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
