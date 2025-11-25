FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY main.py .
COPY import_data.py .
COPY sample_data.csv .
COPY static/ ./static/

# Import data on build (ignore errors if it fails)
RUN python import_data.py sample_data.csv || echo "Warning: Sample data import failed, continuing..."

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
