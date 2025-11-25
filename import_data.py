import sqlite3
import pandas as pd
import sys

def import_data(csv_file: str, db_file: str = "database.db"):
    """Import CSV data into SQLite database."""
    
    # Read CSV
    print(f"Reading {csv_file}...")
    df = pd.read_csv(csv_file)
    
    # Connect to SQLite
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    # Create table
    print("Creating table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY,
            created TEXT,
            bmt_id TEXT,
            name TEXT,
            businesstype TEXT,
            city TEXT,
            street TEXT,
            streetno TEXT,
            zip TEXT,
            property TEXT,
            installation_fee REAL,
            quarterly_fee REAL,
            latitude REAL,
            longitude REAL
        )
    """)
    
    # Clear existing data
    cursor.execute("DELETE FROM locations")
    
    # Insert data
    print(f"Importing {len(df)} records...")
    df.to_sql('locations', conn, if_exists='append', index=False)
    
    conn.commit()
    
    # Print summary
    cursor.execute("SELECT COUNT(*) FROM locations")
    count = cursor.fetchone()[0]
    print(f"\n✓ Successfully imported {count} records")
    
    cursor.execute("SELECT COUNT(DISTINCT city) FROM locations")
    cities = cursor.fetchone()[0]
    print(f"✓ Found {cities} unique cities")
    
    conn.close()

if __name__ == "__main__":
    csv_file = sys.argv[1] if len(sys.argv) > 1 else "sample_data.csv"
    import_data(csv_file)
