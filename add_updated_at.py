import psycopg2

def add_updated_at():
    try:
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            database="Nexgen_erp",
            user="postgres",
            password="toor"
        )
        with conn.cursor() as cur:
            cur.execute('SET search_path TO "Finances";')
            print("Adding updated_at column to vendor_order table...")
            cur.execute("ALTER TABLE vendor_order ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;")
            conn.commit()
            print("Successfully added updated_at column.")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_updated_at()
