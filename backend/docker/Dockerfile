FROM python:3.11-slim AS builder

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
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Prisma schema first (before full code copy for better caching)
COPY prisma ./prisma

# Generate Prisma client with specific version (pin to Prisma 5.x to avoid P1012 error)
# Using npx with @5.10.0 to ensure compatibility with DATABASE_URL in schema
RUN npx prisma@5.10.0 generate

# Copy application code (excluding prisma folder which we already have)
COPY . .

# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Install Node.js in runtime for migrations (npx prisma migrate deploy)
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Copy generated Prisma client from builder
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser
USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
