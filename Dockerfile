FROM python:3.11-slim

# Set platform explicitly
ARG TARGETPLATFORM
ARG BUILDPLATFORM

WORKDIR /app

# Critical: Disable all threading in numpy/pandas/BLAS libraries
ENV OMP_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV VECLIB_MAXIMUM_THREADS=1
ENV NUMEXPR_NUM_THREADS=1
ENV NUMEXPR_MAX_THREADS=1
ENV BLIS_NUM_THREADS=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libproj-dev \
    proj-data \
    proj-bin \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --no-binary :all: pyproj && \
    pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY main.py .
COPY import_data.py .
COPY sample_data.csv .
COPY static/ ./static/

# Expose port
EXPOSE 8000

# Run with single worker only (critical for stability)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
