#!/bin/bash

# Streaming Service Deployment Script for Ubuntu
# Автоматический скрипт развертывания стримингового сервиса

set -e

echo "🚀 Starting Streaming Service Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check Ubuntu version
UBUNTU_VERSION=$(lsb_release -rs)
print_status "Detected Ubuntu version: $UBUNTU_VERSION"

if [[ "$UBUNTU_VERSION" != "20.04" && "$UBUNTU_VERSION" != "22.04" && "$UBUNTU_VERSION" != "24.04" ]]; then
    print_warning "This script is tested on Ubuntu 20.04, 22.04, and 24.04"
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    git \
    htop \
    nload \
    ufw

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    print_status "Docker installed successfully"
else
    print_status "Docker is already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose is already installed"
fi

# Create application directory
APP_DIR="/opt/streaming-service"
print_status "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Copy application files
print_status "Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Create video storage directory
print_status "Creating video storage directory..."
sudo mkdir -p /var/lib/streamservice/videos
sudo chown $USER:$USER /var/lib/streamservice/videos

# Configure firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 8081/tcp
sudo ufw allow 8443/tcp
sudo ufw allow 5433/tcp  # PostgreSQL (optional, for external access)
sudo ufw allow 6380/tcp  # Redis (optional, for external access)

# Create systemd service for auto-start
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/streaming-service.service > /dev/null <<EOF
[Unit]
Description=Streaming Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl enable streaming-service.service

# Build and start containers
print_status "Building and starting containers..."
docker-compose up -d --build

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Check service status
print_status "Checking service status..."
docker-compose ps

# Create monitoring script
print_status "Creating monitoring script..."
cat > $APP_DIR/monitor.sh << 'EOF'
#!/bin/bash

echo "=== Streaming Service Status ==="
docker-compose ps

echo -e "\n=== Resource Usage ==="
docker stats --no-stream

echo -e "\n=== Disk Usage ==="
df -h /var/lib/streamservice/videos

echo -e "\n=== Recent Logs ==="
docker-compose logs --tail=20 backend
EOF

chmod +x $APP_DIR/monitor.sh

# Create backup script
print_status "Creating backup script..."
cat > $APP_DIR/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/streaming-service"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Creating backup: $BACKUP_DIR/backup_$DATE"

# Backup database
docker-compose exec -T postgres pg_dump -U streamuser streamservice > $BACKUP_DIR/db_backup_$DATE.sql

# Backup videos (if not too large)
if [ $(du -sm /var/lib/streamservice/videos | cut -f1) -lt 10000 ]; then
    tar -czf $BACKUP_DIR/videos_backup_$DATE.tar.gz -C /var/lib/streamservice videos
fi

# Keep only last 7 backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE"
EOF

chmod +x $APP_DIR/backup.sh

# Create update script
print_status "Creating update script..."
cat > $APP_DIR/update.sh << 'EOF'
#!/bin/bash

echo "Updating Streaming Service..."

# Stop services
docker-compose down

# Pull latest changes
git pull

# Rebuild and start
docker-compose up -d --build

echo "Update completed!"
EOF

chmod +x $APP_DIR/update.sh

# Set up log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/streaming-service > /dev/null <<EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF

# Create cron job for backups
print_status "Setting up automatic backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/backup.sh >> $APP_DIR/backup.log 2>&1") | crontab -

# Final status check
print_status "Performing final status check..."
sleep 10

if docker-compose ps | grep -q "Up"; then
    print_status "✅ Deployment completed successfully!"
    echo ""
    echo "🌐 Access your streaming service at:"
    echo "   Web Interface: http://$(hostname -I | awk '{print $1}')"
    echo "   API Documentation: http://$(hostname -I | awk '{print $1}')/swagger"
    echo ""
    echo "📁 Application directory: $APP_DIR"
    echo "📊 Monitor service: $APP_DIR/monitor.sh"
    echo "💾 Create backup: $APP_DIR/backup.sh"
    echo "🔄 Update service: $APP_DIR/update.sh"
    echo ""
    echo "🔧 Useful commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Restart: docker-compose restart"
    echo "   Stop: docker-compose down"
    echo "   Start: docker-compose up -d"
    echo ""
    print_warning "Please log out and log back in for Docker group permissions to take effect"
else
    print_error "❌ Deployment failed! Check logs with: docker-compose logs"
    exit 1
fi 