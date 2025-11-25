# Map Fee Analyzer

A simple web application to visualize and compare installation and quarterly fees across Swedish cities.

## Features

- 🗺️ Interactive map showing all locations
- 📊 City-specific statistics and comparison
- 🎯 Search and filter by city
- 📈 Comparison table showing cost differences
- 🐳 Single Docker container deployment

## Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: SQLite
- **Frontend**: Vanilla JavaScript + Leaflet.js
- **Deployment**: Docker

## Quick Start

### Option 1: Deploy to Render (Free, Recommended)

1. Push this repo to GitHub
2. Sign up at [render.com](https://render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Click "Create Web Service"

See [DEPLOY.md](DEPLOY.md) for detailed instructions.

### Option 2: Run Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Import your data
python import_data.py sample_data.csv

# Run the application
python main.py
```

Then open your browser to http://localhost:8000

### Option 3: Run with Docker

```bash
# Build the image
docker build -t map-fee-analyzer .

# Run the container
docker run -p 8000:8000 map-fee-analyzer
```

Then open your browser to http://localhost:8000

## Using Your Own Data

Replace `sample_data.csv` with your own CSV file containing these columns:

- `ID` - Unique identifier
- `CREATED` - Creation date
- `BMT_ID` - BMT identifier
- `NAME` - Business name
- `BUSINESSTYPE` - Type of business
- `CITY` - City name
- `STREET` - Street name
- `STREETNO` - Street number
- `ZIP` - Postal code
- `PROPERTY` - Property identifier
- `INSTALLATION_FEE` - Installation fee amount
- `QUARTERLY_FEE` - Quarterly fee amount
- `LATITUDE` - Latitude coordinate
- `LONGITUDE` - Longitude coordinate

Then run:

```bash
python import_data.py your_data.csv
```

## API Endpoints

- `GET /` - Main application
- `GET /api/cities` - List all cities with statistics
- `GET /api/stats/{city}` - Get statistics for a specific city
- `GET /api/locations` - Get all locations (optional: ?city=Stockholm)
- `GET /api/comparison` - Get comparison data across all cities

## Project Structure

```
map-fee-analyzer/
├── Dockerfile              # Docker configuration
├── requirements.txt        # Python dependencies
├── main.py                # FastAPI application
├── import_data.py         # Data import script
├── sample_data.csv        # Sample data
├── database.db            # SQLite database (created on import)
└── static/
    ├── index.html         # Main HTML page
    ├── app.js            # JavaScript application
    └── style.css         # Styles
```

## Features Explained

### Map View
- Color-coded markers (red = high fees, green = low fees, orange = medium)
- Click markers to see location details
- Auto-zoom to fit all locations

### City Search
- Dropdown to filter locations by city
- Shows city-specific statistics when selected

### Statistics Cards
- Average installation fee
- Average quarterly fee
- Total number of locations

### Comparison Table
- Compare all cities side by side
- Shows installation, quarterly, and annual costs
- Sorted by quarterly fee (highest to lowest)

## Customization

You can easily customize the application:

- **Map center/zoom**: Edit `map = L.map('map').setView([lat, lng], zoom)` in `app.js`
- **Colors**: Modify the `getFeeColor()` function in `app.js`
- **Styling**: Edit `static/style.css`
- **API**: Add new endpoints in `main.py`

## License

MIT
