# NextGenTra LMS - Deployment Guide

This guide covers deploying the NextGenTra LMS to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [SSL/HTTPS Configuration](#sslhttps-configuration)
- [Database Setup](#database-setup)
- [Monitoring](#monitoring)
- [Backup Strategy](#backup-strategy)
- [Scaling](#scaling)

## Prerequisites

- Docker & Docker Compose (recommended) or individual services
- Domain name (for production)
- SSL certificates (for HTTPS)
- PostgreSQL database (if not using Docker)
- Redis instance (if not using Docker)

## Environment Setup

### Backend (.env)

Create `backend/.env`:

```env
# Environment
ENVIRONMENT=production
DEBUG=false

# Database
DATABASE_URL=postgresql://user:password@host:5432/lms
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://host:6379/0

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-min-256-bit
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
ALLOWED_ORIGINS=https://teacher.yourdomain.com,https://student.yourdomain.com

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Sentry (optional)
SENTRY_DSN=
```

### Frontend (.env.local)

Create `apps/teacher-portal/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://teacher.yourdomain.com
```

Create `apps/student-portal/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://student.yourdomain.com
```

## Deployment Options

### Option 1: Docker Compose (Recommended)

1. Update `docker-compose.yml` for production:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: lms
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    networks:
      - lms-network
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER}']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - lms-network

  backend:
    build:
      context: ./backend
      dockerfile: docker/Dockerfile.prod
    restart: always
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/lms
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      ALLOWED_ORIGINS: https://teacher.yourdomain.com,https://student.yourdomain.com
    volumes:
      - ./backend:/app
      - /app/__pycache__
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - lms-network
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.backend.rule=Host(`api.yourdomain.com`)'
      - 'traefik.http.services.backend.loadbalancer.server.port=8000'

  teacher-portal:
    build:
      context: ./apps/teacher-portal
      dockerfile: Dockerfile.prod
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
    depends_on:
      - backend
    networks:
      - lms-network
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.teacher.rule=Host(`teacher.yourdomain.com`)'
      - 'traefik.http.services.teacher.loadbalancer.server.port=3000'

  student-portal:
    build:
      context: ./apps/student-portal
      dockerfile: Dockerfile.prod
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
    depends_on:
      - backend
    networks:
      - lms-network
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.student.rule=Host(`student.yourdomain.com`)'
      - 'traefik.http.services.student.loadbalancer.server.port=3001'

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - teacher-portal
      - student-portal
      - backend
    networks:
      - lms-network

networks:
  lms-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

2. Create production Dockerfiles:

`backend/docker/Dockerfile.prod`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Run as non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

3. Deploy:

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

### Option 2: Manual Deployment

1. Build frontend apps:

```bash
npm run build
```

2. Deploy `apps/teacher-portal/.next` and `apps/student-portal/.next` to hosting

3. Deploy backend:

```bash
cd backend
pip install -r requirements.txt
npx prisma generate
uvicorn main:app --host 0.0.0.0 --port 8000
```

## SSL/HTTPS Configuration

### Using Nginx as Reverse Proxy

`nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream teacher {
        server teacher-portal:3000;
    }

    upstream student {
        server student-portal:3001;
    }

    # Teacher portal
    server {
        listen 443 ssl http2;
        server_name teacher.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location / {
            proxy_pass http://teacher;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # Student portal
    server {
        listen 443 ssl http2;
        server_name student.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location / {
            proxy_pass http://student;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # Backend API
    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name _;
        return 301 https://$server_name$request_uri;
    }
}
```

### Using Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d teacher.yourdomain.com -d student.yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Database Setup

### Initial Setup

```bash
# Run migrations
cd backend
npx prisma migrate deploy

# Optional: seed data
npx prisma db seed
```

### Backup Strategy

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR=/backup
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U postgres lms > $BACKUP_DIR/lms_backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
```

## Monitoring

### Health Checks

- Backend: `GET /health` returns `{"status": "healthy"}`
- Database: `pg_isready`
- Redis: `redis-cli ping`

### Metrics

Consider adding:

- Prometheus for metrics
- Grafana for dashboards
- Sentry for error tracking
- Application Performance Monitoring (APM)

### Logging

Structured JSON logging is enabled in production:

```python
# Backend uses structlog
import structlog
logger = structlog.get_logger()
logger.info("request_processed", user_id=user.id, duration=ms)
```

View logs:

```bash
docker-compose logs -f backend
docker-compose logs -f teacher-portal
docker-compose logs -f student-portal
```

## Scaling

### Horizontal Scaling

1. **Backend**:
   - Increase replica count in docker-compose
   - Load balance with nginx or cloud LB
   - Shared Redis for session storage

2. **Frontend**:
   - Deploy multiple instances behind load balancer
   - Use CDN for static assets
   - Enable caching headers

### Database Scaling

- Read replicas for reporting queries
- Connection pooling (configured in Prisma)
- Regular VACUUM and ANALYZE

### Redis Scaling

- Redis Cluster for high availability
- Redis Sentinel for failover

## Maintenance

### Regular Tasks

- **Daily**: Backup database, review logs
- **Weekly**: Update dependencies, check metrics
- **Monthly**: Security audits, performance review

### Updates

```bash
# Update dependencies
npm update
cd backend && pip install --upgrade -r requirements.txt

# Rebuild and redeploy
docker-compose -f docker-compose.prod.yml up -d --build
```

### Rollback

```bash
# Previous release
docker-compose -f docker-compose.prod.yml up -d --no-deps --force-recreate teacher-portal@previous
```

## Support

For deployment issues:

1. Check logs: `docker-compose logs -f [service]`
2. Verify environment variables
3. Check database connectivity
4. Review health endpoints
