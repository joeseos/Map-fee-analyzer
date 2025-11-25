# Quick Start Guide

## What You've Got

A complete, working web application that:
- Shows locations on an interactive map
- Calculates average fees per city
- Lets you search and filter by city
- Compares costs across all cities
- Runs in a single Docker container

## Run It Now (3 options)

### Option 1: Docker (Recommended)
```bash
docker build -t map-fee-analyzer .
docker run -p 8000:8000 map-fee-analyzer
```
Open http://localhost:8000

### Option 2: Local Python
```bash
pip install -r requirements.txt
./start.sh
```
Open http://localhost:8000

### Option 3: Step by Step
```bash
pip install -r requirements.txt
python import_data.py sample_data.csv
python main.py
```
Open http://localhost:8000

## Use Your Real Data

1. Replace `sample_data.csv` with your CSV file
2. Make sure it has these columns:
   - ID, CREATED, BMT_ID, NAME, BUSINESSTYPE, CITY, STREET, STREETNO, ZIP, PROPERTY
   - INSTALLATION_FEE, QUARTERLY_FEE, LATITUDE, LONGITUDE
3. Run: `python import_data.py your_file.csv`
4. Start the app!

## What You'll See

1. **Map View**: Interactive map with color-coded markers
   - Red = High fees
   - Green = Low fees  
   - Orange = Medium fees
   - Click any marker for details

2. **City Search**: Dropdown to filter by city

3. **Statistics**: Shows averages for selected city or all data

4. **Comparison Table**: Compare all cities side-by-side

## Customization

- **Change map center**: Edit line 2 in `static/app.js`
- **Adjust colors**: Edit `getFeeColor()` in `static/app.js`
- **Style changes**: Edit `static/style.css`
- **Add API endpoints**: Edit `main.py`

## Tech Stack

- FastAPI (Python backend)
- SQLite (database)
- Leaflet.js (maps)
- Vanilla JavaScript (no build step!)
- Single Docker container

## Files

```
map-fee-analyzer/
├── Dockerfile           # Docker config
├── requirements.txt     # Python packages
├── main.py             # FastAPI app
├── import_data.py      # Data importer
├── sample_data.csv     # Sample data
├── start.sh            # Startup script
└── static/
    ├── index.html      # Web page
    ├── app.js         # Map logic
    └── style.css      # Styling
```

## API Endpoints

- `GET /` - Web interface
- `GET /api/cities` - All cities with stats
- `GET /api/stats/{city}` - Stats for one city
- `GET /api/locations` - All locations
- `GET /api/locations?city=Stockholm` - Filter by city
- `GET /api/comparison` - Comparison data

## That's It!

Simple, fast, and runs in one container. No complex setup needed.
