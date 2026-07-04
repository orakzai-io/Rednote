# ── Build Stage: React Frontend ──────────────────────────────────────
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
# VITE_API_URL is empty so all requests go to the same origin (single-container mode)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── Build Stage: Python dependencies ─────────────────────────────────
FROM python:3.12-slim AS backend-builder

WORKDIR /app

# Install compilation system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ── Production Runtime Stage ─────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Install runtime system dependencies (pymupdf needs libgl and libglib, curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy python packages and binaries from backend-builder
COPY --from=backend-builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy backend application code
COPY backend/ ./

# Copy built frontend assets to the static directory in backend
COPY --from=frontend-builder /app/frontend/dist ./static

# Create directories for uploads and fastembed cache
RUN mkdir -p /app/uploads /app/fastembed_cache

# Expose port 7860 (Hugging Face default)
EXPOSE 7860

# Run the FastAPI application using uvicorn on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
