FROM python:3.11-slim

WORKDIR /app

# Install system dependencies + Node.js for Prisma CLI
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    gcc \
    postgresql-client \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install specific Prisma CLI version (5.x) to avoid P1012 error with url in schema
RUN npm install -g prisma@5.10.0

# Create symlink for prisma-client-python (provided by prisma package)
RUN ln -sf /usr/local/bin/prisma /usr/local/bin/prisma-client-python || true

# Copy application code
COPY backend/ ./

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser
USER appuser

EXPOSE 8000

# Generate Prisma client using pinned version, then start server
CMD ["sh", "-c", "prisma generate && uvicorn main:app --host 0.0.0.0 --port 8000"]
