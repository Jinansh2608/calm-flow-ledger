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
            print("Renaming item_description to item_name in vendor_order_line_item...")
            cur.execute("""
                ALTER TABLE vendor_order_line_item RENAME COLUMN item_description TO item_name;
            """)
            conn.commit()
            print("Column renamed successfully.")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run()
