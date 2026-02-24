import sys
sys.path.append('../Backend')
from app.database import get_db

conn = get_db()
try:
    with conn.cursor() as cur:
        # vendor_order
        cur.execute("""
            ALTER TABLE vendor_order 
            ADD COLUMN IF NOT EXISTS project_id BIGINT,
            ADD COLUMN IF NOT EXISTS po_date DATE,
            ADD COLUMN IF NOT EXISTS due_date DATE,
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS work_status VARCHAR(50) DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending'
        """)
        # billing_po
        cur.execute("""
            ALTER TABLE billing_po
            ADD COLUMN IF NOT EXISTS project_id BIGINT
        """)
    conn.commit()
    print("Schema patched successfully!")
except Exception as e:
    conn.rollback()
    print(f"Error: {e}")
finally:
    conn.close()
