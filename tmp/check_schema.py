import psycopg2
from psycopg2.extras import RealDictCursor

def check():
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="Nexgen_erp",
        user="postgres",
        password="toor",
        cursor_factory=RealDictCursor
    )
    cur = conn.cursor()
    cur.execute('SET search_path TO "Finances";')
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'vendor_order_line_item'")
    for row in cur.fetchall():
        print(row['column_name'])
    conn.close()

if __name__ == "__main__":
    check()
