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
            
            print("--- vendor_order ---")
            cur.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'vendor_order' 
                AND table_schema = 'Finances'
            """)
            for col in cur.fetchall():
                print(f"- {col['column_name']} ({col['data_type']}) - {col['is_nullable']}")

            print("\n--- vendor_order_line_item ---")
            cur.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'vendor_order_line_item' 
                AND table_schema = 'Finances'
            """)
            for col in cur.fetchall():
                print(f"- {col['column_name']} ({col['data_type']}) - {col['is_nullable']}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
