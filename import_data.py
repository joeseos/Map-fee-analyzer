import sqlite3
import pandas as pd
import sys
from pyproj import Transformer

# RT90 to WGS84 transformer
rt90_to_wgs84 = Transformer.from_crs("EPSG:3021", "EPSG:4326", always_xy=True)

def convert_rt90_to_wgs84(rt90_x, rt90_y):
    """Convert RT90 coordinates to WGS84 (latitude, longitude)."""
    try:
        if pd.isna(rt90_x) or pd.isna(rt90_y) or rt90_x == '' or rt90_y == '':
            return None, None
        
        x = float(rt90_x)
        y = float(rt90_y)
        
        lon, lat = rt90_to_wgs84.transform(y, x)
        return lat, lon
    except Exception as e:
        print(f"Error converting coordinates: {e}")
        return None, None

def import_data(csv_file: str, db_file: str = "database.db"):
    """Import CSV data into SQLite database."""
    
    # Read CSV
    print(f"Reading {csv_file}...")
    df = pd.read_csv(csv_file)
    
    # Convert RT90 coordinates to WGS84
    print("Converting coordinates...")
    coordinates = df.apply(
        lambda row: convert_rt90_to_wgs84(row.get('RT90X'), row.get('RT90Y')), 
        axis=1
    )
    df['LATITUDE'] = coordinates.apply(lambda x: x[0])
    df['LONGITUDE'] = coordinates.apply(lambda x: x[1])
    
    # Rename columns
    df = df.rename(columns={
        'INSTALLATION': 'INSTALLATION_FEE',
        'MONTHLYFEE': 'QUARTERLY_FEE'
    })
    
    # Drop rows with invalid coordinates
    df = df.dropna(subset=['LATITUDE', 'LONGITUDE'])
    
    # Prepare data for database
    df_import = pd.DataFrame({
        'id': df['ID'],
        'created': df['CREATED'],
        'bmt_id': df['BMT_ID'],
        'name': df['NAME'],
        'businesstype': df['BUSINESSTYPE'],
        'city': df['CITY'],
        'street': df['STREET'],
        'streetno': df['STREETNO'],
        'zip': df['ZIP'],
        'property': df['PROPERTY'],
        'supplier': df.get('SUPPLIER', ''),
        'accesstype': df.get('ACCESSTYPE', ''),
        'installation_fee': df['INSTALLATION_FEE'],
        'quarterly_fee': df['QUARTERLY_FEE'],
        'latitude': df['LATITUDE'],
        'longitude': df['LONGITUDE']
    })
    
    # Connect to SQLite
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    # Create table with all columns
    print("Creating table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER,
            created TEXT,
            bmt_id TEXT,
            name TEXT,
            businesstype TEXT,
            city TEXT,
            street TEXT,
            streetno TEXT,
            zip TEXT,
            property TEXT,
            supplier TEXT,
            accesstype TEXT,
            installation_fee REAL,
            quarterly_fee REAL,
            latitude REAL,
            longitude REAL
        )
    """)
    
    # Clear existing data
    cursor.execute("DELETE FROM locations")
    
    # Insert data
    print(f"Importing {len(df_import)} records...")
    df_import.to_sql('locations', conn, if_exists='append', index=False)
    
    conn.commit()
    
    # Print summary
    cursor.execute("SELECT COUNT(*) FROM locations")
    count = cursor.fetchone()[0]
    print(f"\n✓ Successfully imported {count} records")
    
    cursor.execute("SELECT COUNT(DISTINCT city) FROM locations")
    cities = cursor.fetchone()[0]
    print(f"✓ Found {cities} unique cities")
    
    # Show supplier and accesstype breakdown
    cursor.execute("SELECT supplier, COUNT(*) FROM locations WHERE supplier != '' GROUP BY supplier")
    suppliers = cursor.fetchall()
    if suppliers:
        print(f"\n✓ Suppliers: {len(suppliers)}")
        for supplier, count in suppliers[:5]:
            print(f"  - {supplier}: {count} locations")
    
    cursor.execute("SELECT accesstype, COUNT(*) FROM locations WHERE accesstype != '' GROUP BY accesstype")
    accesstypes = cursor.fetchall()
    if accesstypes:
        print(f"\n✓ Access types: {len(accesstypes)}")
        for accesstype, count in accesstypes:
            print(f"  - {accesstype}: {count} locations")
    
    conn.close()

if __name__ == "__main__":
    csv_file = sys.argv[1] if len(sys.argv) > 1 else "sample_data.csv"
    import_data(csv_file)
