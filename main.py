from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import sqlite3
from typing import List, Dict, Optional
from contextlib import contextmanager
import pandas as pd
import io
from datetime import datetime

app = FastAPI(title="Map Fee Analyzer")

DB_FILE = "database.db"

@contextmanager
def get_db():
    """Database connection context manager."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

@app.get("/api/cities")
def get_cities():
    """Get list of all cities with their average fees."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                city,
                COUNT(*) as count,
                AVG(installation_fee) as avg_installation_fee,
                AVG(quarterly_fee) as avg_quarterly_fee,
                MIN(installation_fee) as min_installation_fee,
                MAX(installation_fee) as max_installation_fee,
                MIN(quarterly_fee) as min_quarterly_fee,
                MAX(quarterly_fee) as max_quarterly_fee
            FROM locations
            GROUP BY city
            ORDER BY city
        """)
        
        cities = []
        for row in cursor.fetchall():
            cities.append({
                "city": row[0],
                "count": row[1],
                "avg_installation_fee": round(row[2], 2),
                "avg_quarterly_fee": round(row[3], 2),
                "min_installation_fee": row[4],
                "max_installation_fee": row[5],
                "min_quarterly_fee": row[6],
                "max_quarterly_fee": row[7]
            })
        
        return cities

@app.get("/api/stats/{city}")
def get_city_stats(city: str):
    """Get detailed statistics for a specific city."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                city,
                COUNT(*) as count,
                AVG(installation_fee) as avg_installation_fee,
                AVG(quarterly_fee) as avg_quarterly_fee,
                MIN(installation_fee) as min_installation_fee,
                MAX(installation_fee) as max_installation_fee,
                MIN(quarterly_fee) as min_quarterly_fee,
                MAX(quarterly_fee) as max_quarterly_fee
            FROM locations
            WHERE LOWER(city) = LOWER(?)
            GROUP BY city
        """, (city,))
        
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="City not found")
        
        return {
            "city": row[0],
            "count": row[1],
            "avg_installation_fee": round(row[2], 2),
            "avg_quarterly_fee": round(row[3], 2),
            "min_installation_fee": row[4],
            "max_installation_fee": row[5],
            "min_quarterly_fee": row[6],
            "max_quarterly_fee": row[7]
        }

@app.get("/api/locations")
def get_locations(
    city: Optional[str] = None,
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lng: Optional[float] = None,
    max_lng: Optional[float] = None
):
    """Get all locations, optionally filtered by city or bounding box."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        query = "SELECT * FROM locations WHERE 1=1"
        params = []
        
        if city:
            query += " AND LOWER(city) = LOWER(?)"
            params.append(city)
        
        if min_lat and max_lat and min_lng and max_lng:
            query += " AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?"
            params.extend([min_lat, max_lat, min_lng, max_lng])
        
        cursor.execute(query, params)
        
        locations = []
        for row in cursor.fetchall():
            locations.append({
                "id": row["id"],
                "name": row["name"],
                "city": row["city"],
                "street": row["street"],
                "streetno": row["streetno"],
                "zip": row["zip"],
                "installation_fee": row["installation_fee"],
                "quarterly_fee": row["quarterly_fee"],
                "latitude": row["latitude"],
                "longitude": row["longitude"]
            })
        
        return locations

@app.get("/api/comparison")
def get_comparison():
    """Get comparison data across all cities for visualization."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                city,
                AVG(installation_fee) as avg_installation_fee,
                AVG(quarterly_fee) as avg_quarterly_fee
            FROM locations
            GROUP BY city
            ORDER BY avg_quarterly_fee DESC
        """)
        
        comparison = []
        for row in cursor.fetchall():
            comparison.append({
                "city": row[0],
                "avg_installation_fee": round(row[1], 2),
                "avg_quarterly_fee": round(row[2], 2)
            })
        
        return comparison

@app.get("/api/data-info")
def get_data_info():
    """Get information about current data."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get total locations
        cursor.execute("SELECT COUNT(*) FROM locations")
        total_locations = cursor.fetchone()[0]
        
        # Get total cities
        cursor.execute("SELECT COUNT(DISTINCT city) FROM locations")
        total_cities = cursor.fetchone()[0]
        
        # Get last updated (we'll use the created date of the most recent entry)
        cursor.execute("SELECT MAX(created) FROM locations")
        last_updated = cursor.fetchone()[0] or datetime.now().isoformat()
        
        return {
            "total_locations": total_locations,
            "total_cities": total_cities,
            "last_updated": last_updated
        }

@app.post("/api/upload-data")
async def upload_data(file: UploadFile = File(...)):
    """Upload and import CSV data."""
    try:
        # Read CSV content
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Validate required columns
        required_columns = [
            'ID', 'CITY', 'INSTALLATION_FEE', 'QUARTERLY_FEE', 'LATITUDE', 'LONGITUDE'
        ]
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Connect to database
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Clear existing data
        cursor.execute("DELETE FROM locations")
        
        # Import new data
        df.to_sql('locations', conn, if_exists='append', index=False)
        
        conn.commit()
        
        # Get stats
        cursor.execute("SELECT COUNT(*) FROM locations")
        records_imported = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT city) FROM locations")
        cities_found = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "success": True,
            "records_imported": records_imported,
            "cities_found": cities_found
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    """Serve the main HTML page."""
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
