#!/bin/bash
# EC2 Initial Setup Script for 4-in-a-Row Deployment
# Run this script once on a fresh EC2 instance

set -e

echo "🚀 Setting up EC2 for 4-in-a-Row deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
node --version
npm --version

# Install Nginx
echo "📦 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
fi
nginx -v

# Create backend directory
echo "📁 Creating backend directory..."
sudo mkdir -p /opt/4-in-a-row-backend
sudo chown $USER:$USER /opt/4-in-a-row-backend

# Create frontend directory
echo "📁 Creating frontend directory..."
sudo mkdir -p /var/www/pushparaj
sudo chown -R www-data:www-data /var/www/pushparaj
sudo chmod -R 755 /var/www/pushparaj

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw allow 3000/tcp # Backend API
sudo ufw allow 3001/tcp # WebSocket
echo "y" | sudo ufw enable || true

# Create systemd service for backend
echo "⚙️ Creating backend systemd service..."
sudo tee /etc/systemd/system/4-in-a-row-backend.service > /dev/null <<EOF
[Unit]
Description=4 in a Row Backend WebSocket Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/4-in-a-row-backend
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/4-in-a-row-backend.log
StandardError=append:/var/log/4-in-a-row-backend-error.log
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable 4-in-a-row-backend

# Create Nginx configuration
echo "⚙️ Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/4-in-a-row > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    root /var/www/pushparaj;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/4-in-a-row /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
echo "✅ Testing Nginx configuration..."
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Create log files
echo "📝 Creating log files..."
sudo touch /var/log/4-in-a-row-backend.log
sudo touch /var/log/4-in-a-row-backend-error.log
sudo chown $USER:$USER /var/log/4-in-a-row-backend*.log

echo ""
echo "✅ EC2 setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add GitHub secrets to your repository:"
echo "   - EC2_HOST: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "   - EC2_USER: $USER"
echo "   - EC2_SSH_KEY: (your private SSH key content)"
echo "   - VITE_WS_URL: ws://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3001"
echo ""
echo "2. Push your code to GitHub main branch"
echo ""
echo "3. GitHub Actions will automatically deploy!"
echo ""
echo "📊 Service status:"
sudo systemctl status nginx --no-pager
echo ""
echo "🔥 Firewall status:"
sudo ufw status
echo ""
