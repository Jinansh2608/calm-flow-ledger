import psycopg2
import os
from dotenv import load_dotenv

# Use absolute paths to Backend .env
BACKEND_DIR = r"c:\Users\Hitansh\Desktop\Nexgen\Finances\Backend"
load_dotenv(os.path.join(BACKEND_DIR, '.env'))

def run_migration():
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    database = os.getenv("DB_NAME", "Nexgen_erp")
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "toor")
    
    print(f"Connecting to {database} on {host}...")
    
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
        cur = conn.cursor()
        
        # SQL for migration
        sql = """
        -- Restore GST related columns to quotation and quotation_line_item
        ALTER TABLE "Finances".quotation ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15, 2) DEFAULT 0;
        ALTER TABLE "Finances".quotation ADD COLUMN IF NOT EXISTS total_gst DECIMAL(15, 2) DEFAULT 0;

        ALTER TABLE "Finances".quotation_line_item ADD COLUMN IF NOT EXISTS tax DECIMAL(5, 2) DEFAULT 18;
        ALTER TABLE "Finances".quotation_line_item ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(15, 2) DEFAULT 0;
        ALTER TABLE "Finances".quotation_line_item ADD COLUMN IF NOT EXISTS total DECIMAL(15, 2) DEFAULT 0;
        ALTER TABLE "Finances".quotation_line_item ADD COLUMN IF NOT EXISTS hsn_sac_code VARCHAR(20);
        """
            
        print("Executing migration...")
        cur.execute(sql)
        conn.commit()
        print("Migration successful!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_migration()
