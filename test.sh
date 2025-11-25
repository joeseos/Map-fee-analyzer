#!/bin/bash

echo "🧪 Testing Map Fee Analyzer before deployment..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check Python version
echo "1️⃣ Checking Python version..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓${NC} $PYTHON_VERSION"
else
    echo -e "${RED}✗${NC} Python 3 not found"
    exit 1
fi
echo ""

# Test 2: Check dependencies
echo "2️⃣ Checking dependencies..."
if pip list | grep -q fastapi; then
    echo -e "${GREEN}✓${NC} FastAPI installed"
else
    echo -e "${YELLOW}!${NC} Installing dependencies..."
    pip install -r requirements.txt
fi
echo ""

# Test 3: Import data
echo "3️⃣ Testing data import..."
if python import_data.py sample_data.csv > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Data import successful"
else
    echo -e "${RED}✗${NC} Data import failed"
    exit 1
fi
echo ""

# Test 4: Check database
echo "4️⃣ Checking database..."
if [ -f "database.db" ]; then
    RECORD_COUNT=$(sqlite3 database.db "SELECT COUNT(*) FROM locations;" 2>/dev/null)
    echo -e "${GREEN}✓${NC} Database created with $RECORD_COUNT records"
else
    echo -e "${RED}✗${NC} Database not created"
    exit 1
fi
echo ""

# Test 5: Start server briefly
echo "5️⃣ Testing server startup..."
timeout 3 python -m uvicorn main:app --host 0.0.0.0 --port 8000 > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2

if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Server starts successfully"
    kill $SERVER_PID 2>/dev/null
else
    echo -e "${RED}✗${NC} Server failed to start"
    exit 1
fi
echo ""

# Test 6: Check static files
echo "6️⃣ Checking static files..."
MISSING_FILES=0
for file in "static/index.html" "static/app.js" "static/style.css"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file missing"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    exit 1
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ All tests passed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You're ready to:"
echo "  1. Push to GitHub"
echo "  2. Deploy on Render"
echo ""
echo "Or run locally with: ./start.sh"
