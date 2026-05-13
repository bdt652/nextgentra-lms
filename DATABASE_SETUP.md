# Database & Cache Configuration

## Summary

Configured local development environment using Docker for PostgreSQL database and Redis cache.

## Services

### PostgreSQL (Database)
- **Image**: postgres:17-alpine
- **Port**: 5432
- **Database**: lms_db
- **Username**: appuser
- **Password**: Thang_652123
- **Volume**: `backend-python_postgres_data` (persistent)

### Redis (Cache/Session Store)
- **Image**: redis:8-alpine
- **Port**: 6379
- **Volume**: `backend-python_redis_data` (persistent)
- **Persistence**: AOF enabled (appendonly yes)

## Configuration Files

### `backend-python/docker-compose.yml`
Defines both PostgreSQL and Redis services with health checks and persistent volumes.

### `backend-python/.env`
- **DATABASE_URL**: `postgresql://appuser:Thang_652123@localhost:5432/lms_db`
- **REDIS_URL**: `redis://localhost:6379`

Remote database at `192.168.53.101` is commented out for reference.

### Prisma Schema
Location: `backend-python/prisma/schema.prisma`

Models:
- `Student` - Student authentication
- `Teacher` - Teacher & admin with RBAC
- `Role` - Roles for permission groups
- `Permission` - Individual permissions
- `RefreshToken` - Token management
- `_PermissionToRole` - Many-to-many join table

## How to Start

### Step 1: Start Docker Desktop
Make sure Docker Desktop is running on Windows.

### Step 2: Start Database & Redis Services

**Option A - Use the startup script (recommended):**

**PowerShell (Admin):**
```powershell
.\start-databases.ps1
```

**Or Bash (Git Bash/WSL):**
```bash
./start-databases.sh
```

**Option B - Manual start:**

```powershell
cd backend-python
docker-compose up -d
```

### Step 3: Wait for Health Checks

The script will wait for both services to become healthy:
- PostgreSQL: health check via `pg_isready`
- Redis: health check via `redis-cli ping`

### Step 4: Initialize Database

```powershell
cd backend-python

# If using virtual environment:
.\venv\Scripts\Activate.ps1

# Generate Prisma client
python -m prisma generate

# Apply migrations (first time only or when schema changes)
python -m prisma migrate dev --name init
# OR for production deployments:
# python -m prisma migrate deploy
```

### Step 5: Test Connections

**Test PostgreSQL:**
```powershell
cd backend-python
python test_db_connection.py
```

Expected output:
```
[OK] Connected to PostgreSQL successfully!
[OK] Can query database
📊 Database Statistics:
   Students: 0
   Teachers: 0
   Roles: 0
   Permissions: 0
✅ All checks passed! Database is ready.
```

**Test Redis:**
```powershell
cd backend-python
python test_redis_connection.py
```

Expected output:
```
[OK] Redis connection successful - PONG
[OK] SET test:lms:connection = hello_world
[OK] GET test:lms:connection = hello_world
[OK] DEL test:lms:connection

📊 Redis Information:
   Version: 8.6.3
   Mode: standalone
   Connected Clients: 1
   Used Memory: 1.43M

✅ All Redis checks passed!
```

### Step 6: Start Backend Server

```powershell
cd backend-python

# Activate virtual environment if needed
.\venv\Scripts\Activate.ps1

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at: **http://localhost:8000**
API docs (Swagger): **http://localhost:8000/docs**
Health check endpoint: **http://localhost:8000/health**

The health endpoint checks:
- Database connectivity
- Redis connectivity (if configured)

## Verification Commands

**Check container status:**
```powershell
docker-compose ps
```

**Check PostgreSQL logs:**
```powershell
docker-compose logs postgres
```

**Check Redis logs:**
```powershell
docker-compose logs redis
```

**Connect to PostgreSQL:**
```powershell
docker-compose exec postgres psql -U appuser -d lms_db
```

**Connect to Redis CLI:**
```powershell
docker-compose exec redis redis-cli
> PING  # Should return PONG
```

**List database tables:**
```powershell
docker-compose exec postgres psql -U appuser -d lms_db -c "\dt"
```

## Notes

- Both databases use Docker volumes for persistent storage
- Data persists across container restarts (unless you use `docker-compose down -v`)
- Redis uses AOF (Append-Only File) persistence for durability
- Network: Both services are on `backend-python_lms-network` bridge network
- Backend application connects to `localhost:5432` (PostgreSQL) and `localhost:6379` (Redis)
- In production, consider using separate networks and more secure credentials
- The Redis health check in the application uses a synchronous client (redis-py)
- Prisma schema uses async interface for asyncio (compatible with FastAPI)

## Troubleshooting

**Port already in use:**
- PostgreSQL port 5432 conflict: Change `ports` mapping in docker-compose.yml
- Redis port 6379 conflict: Change `ports` mapping or stop existing Redis service

**Connection refused:**
- Ensure Docker Desktop is running
- Check container status: `docker-compose ps`
- View logs: `docker-compose logs <service>`

**Prisma errors:**
- Ensure `DATABASE_URL` in `.env` matches PostgreSQL connection string
- Verify database exists: `docker-compose exec postgres psql -U appuser -l`
- Check Prisma schema syntax: `prisma validate`

**Health check not passing:**
- Check both services are running: `docker ps`
- Verify ports are mapped correctly
- Test direct connection: `telnet localhost 5432` and `telnet localhost 6379`

## Cleanup

**Stop services (keep data):**
```powershell
cd backend-python
docker-compose down
```

**Stop services and delete all data:**
```powershell
cd backend-python
docker-compose down -v
```

**Remove containers only:**
```powershell
docker-compose rm -f
```

## Next Steps

After database and Redis are running:
1. Implement authentication flow with refresh tokens
2. Add caching strategies for frequently accessed data
3. Implement session management using Redis
4. Add more API endpoints (courses, assignments, etc.)
5. Build frontend pages that consume the API
