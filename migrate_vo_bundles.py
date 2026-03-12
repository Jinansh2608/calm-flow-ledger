import psycopg2

def migrate():
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
            
            # 1. Add category to vendor_order
            print("Adding category column to vendor_order...")
            cur.execute("""
                ALTER TABLE vendor_order ADD COLUMN IF NOT EXISTS category VARCHAR(255);
            """)
            
            # 2. Make vendor_id optional
            print("Making vendor_id optional in vendor_order...")
            cur.execute("""
                ALTER TABLE vendor_order ALTER COLUMN vendor_id DROP NOT NULL;
            """)
            
            # 3. Add order status and delivery progress to line items to treat them as individual orders
            print("Adding status and progress to vendor_order_line_item...")
            cur.execute("""
                ALTER TABLE vendor_order_line_item ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
                ALTER TABLE vendor_order_line_item ADD COLUMN IF NOT EXISTS delivery_progress INTEGER DEFAULT 0;
                ALTER TABLE vendor_order_line_item ADD COLUMN IF NOT EXISTS vendor_id BIGINT;
                ALTER TABLE vendor_order_line_item ADD COLUMN IF NOT EXISTS order_date DATE;
            """)
            
            conn.commit()
            print("Migration successful.")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
