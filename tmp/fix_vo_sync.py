import psycopg2

def run():
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
            print("Adding client_line_item_id to vendor_order_line_item...")
            cur.execute("""
                ALTER TABLE vendor_order_line_item ADD COLUMN IF NOT EXISTS client_line_item_id BIGINT;
            """)
            conn.commit()
            print("Table updated successfully.")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run()
