import sys
sys.path.append('../Backend')
from app.database import get_db

conn = get_db()
try:
    with conn.cursor() as cur:
        # billing_po
        cur.execute("""
            ALTER TABLE billing_po 
            ADD COLUMN IF NOT EXISTS client_po_id BIGINT,
            ADD COLUMN IF NOT EXISTS billed_value NUMERIC(15,2),
            ADD COLUMN IF NOT EXISTS billed_gst NUMERIC(15,2),
            ADD COLUMN IF NOT EXISTS billed_total NUMERIC(15,2),
            ADD COLUMN IF NOT EXISTS billing_notes TEXT,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        """)
        # billing_po_line_item
        cur.execute("""
            ALTER TABLE billing_po_line_item
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS qty NUMERIC(10,2),
            ADD COLUMN IF NOT EXISTS rate NUMERIC(15,2),
            ADD COLUMN IF NOT EXISTS total NUMERIC(15,2)
        """)
        # Wait, if id is BIGINT now, but UUID in python code.
        # Check what the ID type is in python codebase.
        cur.execute("SELECT data_type FROM information_schema.columns WHERE table_name='billing_po' AND column_name='id'")
        print("billing_po.id type:", cur.fetchone()['data_type'])
    conn.commit()
    print("Schema patched successfully!")
except Exception as e:
    conn.rollback()
    print(f"Error: {e}")
finally:
    conn.close()
