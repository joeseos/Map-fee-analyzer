from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import sqlite3
from typing import List, Dict, Optional
from contextlib import contextmanager

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

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    """Serve the main HTML page."""
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
