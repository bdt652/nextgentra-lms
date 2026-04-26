#!/bin/bash
# Setup script for service-main GitHub Runner (192.168.24.20)
# Run as root or sudo

set -e

echo "=== GitHub Runner Setup for NextGenTra LMS ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
   echo "Please run as root or use sudo"
   exit 1
fi

# 1. Create github-runner user
echo "1. Creating github-runner user..."
if ! id "github-runner" &>/dev/null; then
    adduser --system --group --home /home/github-runner github-runner
    usermod -aG sudo github-runner
    echo "   ✓ github-runner user created"
else
    echo "   ✓ github-runner user already exists"
fi

# 2. Install dependencies
echo "2. Installing dependencies..."
apt-get update
apt-get install -y curl jq git rsync openssh-client
echo "   ✓ Dependencies installed"

# 3. Setup runner directory
echo "3. Setting up runner directory..."
RUNNER_DIR="/opt/runners/github"
sudo -u github-runner mkdir -p "$RUNNER_DIR"
chown -R github-runner:github-runner /opt/runners
echo "   ✓ Runner directory ready"

# 4. Download runner
echo "4. Downloading GitHub runner..."
cd "$RUNNER_DIR"
if [ ! -f "run.sh" ]; then
    sudo -u github-runner curl -o runner.tar.gz -L https://github.com/actions/runner/releases/download/v2.318.0/actions-runner-linux-x64-2.318.0.tar.gz
    sudo -u github-runner tar xzf runner.tar.gz
    echo "   ✓ Runner downloaded"
else
    echo "   ✓ Runner already downloaded"
fi

# 5. Configure runner (if not configured)
if [ ! -f ".runner" ]; then
    echo "5. Configuring runner..."
    echo "   You need to get a token from:"
    echo "   GitHub → YOUR_REPO → Settings → Actions → Runners → New self-hosted runner"
    read -p "   Enter token: " TOKEN
    read -p "   Enter repository URL (e.g., github.com/your-org/nextgentra-lms): " REPO_URL

    cd "$RUNNER_DIR"
    sudo -u github-runner ./config.sh --url "https://$REPO_URL" --token "$TOKEN"
    echo "   ✓ Runner configured"
else
    echo "   ✓ Runner already configured"
fi

# 6. Install as service
echo "6. Installing runner as systemd service..."
cd "$RUNNER_DIR"
sudo -u github-runner sudo ./svc.sh install
systemctl enable actions.runner.*.service
systemctl start actions.runner.*.service
echo "   ✓ Runner service installed and started"

# 7. Generate SSH key
echo "7. Setting up SSH key..."
sudo -u github-runner mkdir -p /home/github-runner/.ssh
sudo -u github-runner ssh-keygen -t ed25519 -f /home/github-runner/.ssh/id_ed25519 -N ""
sudo chmod 700 /home/github-runner/.ssh
sudo chmod 600 /home/github-runner/.ssh/id_ed25519
echo "   ✓ SSH key generated at /home/github-runner/.ssh/id_ed25519"
echo ""
echo "   PUBLIC KEY (copy this to app-main deployer):"
sudo -u github-runner cat /home/github-runner/.ssh/id_ed25519.pub
echo ""

# 8. Status
echo "8. Checking runner service status..."
systemctl status actions.runner.*.service --no-pager -l

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Copy the public key above to app-main:"
echo "   ssh-copy-id -i /home/github-runner/.ssh/id_ed25519.pub deployer@192.168.24.23"
echo "2. Test SSH: ssh deployer@192.168.24.23 'docker compose version'"
echo "3. Verify runner in GitHub: Settings → Actions → Runners"
echo "4. Push to main to test deployment"
