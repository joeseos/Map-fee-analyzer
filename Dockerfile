FROM python:3.11-slim

WORKDIR /app

# Disable threading
ENV OMP_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV MKL_NUM_THREADS=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libproj-dev \
    proj-data \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY main.py .
COPY import_data.py .
COPY static/ ./static/

# Create empty database with table structure
RUN python3 << 'EOF'
import sqlite3
conn = sqlite3.connect('database.db')
cursor = conn.cursor()
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
conn.commit()
conn.close()
print("✅ Database initialized in Dockerfile")
EOF

# Verify database exists
RUN ls -lh database.db

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
