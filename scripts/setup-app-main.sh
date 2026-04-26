#!/bin/bash
# Setup script for app-main (192.168.24.23)
# Run as root or sudo

set -e

echo "=== NextGenTra LMS Production Setup ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
   echo "Please run as root or use sudo"
   exit 1
fi

# 1. Create deployer user
echo "1. Creating deployer user..."
if ! id "deployer" &>/dev/null; then
    adduser --system --group --home /home/deployer deployer
    usermod -aG docker deployer
    echo "   ✓ deployer user created"
else
    echo "   ✓ deployer user already exists"
fi

# 2. Create apps directory
echo "2. Creating /opt/apps directory..."
mkdir -p /opt/apps
chown deployer:deployer /opt/apps
echo "   ✓ /opt/apps ready"

# 3. Switch to deployer and setup
echo "3. Switching to deployer user for initial clone..."
sudo -u deployer -H bash << 'EOF'
cd /opt/apps

if [ ! -d "nextgentra-lms" ]; then
    echo "   Cloning repository..."
    git clone https://github.com/YOUR_ORG/nextgentra-lms.git
    cd nextgentra-lms
else
    echo "   Repository already exists, updating..."
    cd nextgentra-lms
    git fetch origin
    git reset --hard origin/main
fi

# Generate JWT secret if .env doesn't exist
if [ ! -f ".env" ]; then
    echo "   Creating .env file..."
    JWT_SECRET=$(openssl rand -base64 32)
    cat > .env << ENVEOF
DATABASE_URL=postgresql://lms_user:YOUR_DB_PASSWORD@192.168.24.21:5432/lms_db
REDIS_URL=redis://192.168.24.21:6379
JWT_SECRET_KEY=$JWT_SECRET
NODE_ENV=production
ENVEOF
    echo "   ✓ .env created with generated JWT secret"
else
    echo "   ✓ .env already exists"
fi
EOF

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Edit /opt/apps/nextgentra-lms/.env with actual DB credentials"
echo "2. Test: sudo -u deployer docker compose -f /opt/apps/nextgentra-lms/docker-compose.prod.yml build --parallel"
echo "3. Test: sudo -u deployer docker compose -f /opt/apps/nextgentra-lms/docker-compose.prod.yml up -d"
echo "4. Check: sudo -u deployer docker compose -f /opt/apps/nextgentra-lms/docker-compose.prod.yml ps"
