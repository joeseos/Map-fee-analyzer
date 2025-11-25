#!/bin/bash

echo "🚀 Starting Map Fee Analyzer..."
echo ""

# Check if database exists, if not import data
if [ ! -f "database.db" ]; then
    echo "📊 Importing sample data..."
    python import_data.py sample_data.csv
    echo ""
fi

echo "🌐 Starting server on http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""

python -m uvicorn main:app --host 0.0.0.0 --port 8000
