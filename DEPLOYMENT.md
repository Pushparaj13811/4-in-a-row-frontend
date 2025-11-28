# Deployment Setup Guide

## GitHub Actions Setup

### Required Secrets

Add these secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

#### For Both Workflows:
- `EC2_HOST` - Your EC2 instance public IP or domain
- `EC2_USER` - SSH username (usually `ubuntu` or `ec2-user`)
- `EC2_SSH_KEY` - Private SSH key content (entire key including headers)

#### For Frontend Only:
- `VITE_WS_URL` - WebSocket URL (e.g., `ws://your-ec2-ip:3001`)

---

## EC2 Server Setup

### Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Backend Setup

```bash
# Create backend directory
sudo mkdir -p /opt/4-in-a-row-backend
sudo chown $USER:$USER /opt/4-in-a-row-backend

# Create systemd service
sudo tee /etc/systemd/system/4-in-a-row-backend.service > /dev/null <<EOF
[Unit]
Description=4 in a Row Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/4-in-a-row-backend
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable service
sudo systemctl daemon-reload
sudo systemctl enable 4-in-a-row-backend
```

### Frontend Setup

```bash
# Create web directory
sudo mkdir -p /var/www/pushparaj
sudo chown -R www-data:www-data /var/www/pushparaj
sudo chmod -R 755 /var/www/pushparaj

# Configure Nginx
sudo tee /etc/nginx/sites-available/4-in-a-row > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;  # Or use your EC2 IP

    root /var/www/pushparaj;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy WebSocket connections
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/4-in-a-row /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Environment Variables

Create `/opt/4-in-a-row-backend/.env`:

```bash
# Server
PORT=3000
WS_PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=4-in-a-row
DB_USER=your_user
DB_PASSWORD=your_password

# Kafka (optional)
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=4-in-a-row
```

### Firewall Rules

```bash
# Allow HTTP, HTTPS, backend, and WebSocket
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
```

---

## Manual Deployment (First Time)

### Backend

```bash
# On local machine
cd backend
npm ci
npm run build
tar -czf backend-deploy.tar.gz dist package.json package-lock.json

# Copy to EC2
scp -i your-key.pem backend-deploy.tar.gz ubuntu@your-ec2-ip:/tmp/

# On EC2
ssh -i your-key.pem ubuntu@your-ec2-ip
cd /opt/4-in-a-row-backend
tar -xzf /tmp/backend-deploy.tar.gz
npm ci --production
sudo systemctl start 4-in-a-row-backend
sudo systemctl status 4-in-a-row-backend
```

### Frontend

```bash
# On local machine
cd frontend/4-in-a-row-frontend
npm ci
npm run build
tar -czf frontend-dist.tar.gz -C dist .

# Copy to EC2
scp -i your-key.pem frontend-dist.tar.gz ubuntu@your-ec2-ip:/tmp/

# On EC2
ssh -i your-key.pem ubuntu@your-ec2-ip
sudo tar -xzf /tmp/frontend-dist.tar.gz -C /var/www/pushparaj/
sudo chown -R www-data:www-data /var/www/pushparaj
sudo systemctl reload nginx
```

---

## Workflow Triggers

The GitHub Actions will automatically deploy when you push to `main` branch:

**Backend deploys when:**
- Files in `src/` change
- `package.json` or `package-lock.json` changes
- `tsconfig.json` changes

**Frontend deploys when:**
- Files in `src/` or `public/` change
- `index.html` changes
- `package.json`, `package-lock.json`, `vite.config.ts`, or `tsconfig.json` changes

---

## Monitoring & Logs

### Backend Logs
```bash
# View backend logs
sudo journalctl -u 4-in-a-row-backend -f

# View latest 100 lines
sudo journalctl -u 4-in-a-row-backend -n 100
```

### Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Check Service Status
```bash
# Backend status
sudo systemctl status 4-in-a-row-backend

# Nginx status
sudo systemctl status nginx
```

---

## Rollback

### Backend Rollback
```bash
# Stop current version
sudo systemctl stop 4-in-a-row-backend

# Restore from Git
cd /opt/4-in-a-row-backend
git checkout <previous-commit-hash>
npm ci --production
npm run build

# Start service
sudo systemctl start 4-in-a-row-backend
```

### Frontend Rollback
```bash
# Restore from backup
sudo rm -rf /var/www/pushparaj/*
sudo cp -r /var/www/pushparaj.backup/* /var/www/pushparaj/
sudo systemctl reload nginx
```

---

## Health Checks

### Backend Health
```bash
curl http://your-ec2-ip:3000/health
```

### Frontend Health
```bash
curl http://your-ec2-ip/
```

### WebSocket Health
```bash
# Test WebSocket connection
wscat -c ws://your-ec2-ip:3001
```

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
sudo journalctl -u 4-in-a-row-backend -n 50

# Check if port is in use
sudo lsof -i :3000
sudo lsof -i :3001

# Restart service
sudo systemctl restart 4-in-a-row-backend
```

### Frontend not loading
```bash
# Check Nginx config
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify files exist
ls -la /var/www/pushparaj/

# Restart Nginx
sudo systemctl restart nginx
```

### Deployment fails
1. Check GitHub Actions logs
2. Verify SSH key is correct
3. Ensure EC2 security groups allow SSH (port 22)
4. Check disk space: `df -h`
5. Check permissions: `ls -la /var/www/pushparaj`

---

## Security Recommendations

1. **Use HTTPS** - Install Let's Encrypt SSL certificate
2. **Limit SSH access** - Use security groups to restrict SSH to your IP
3. **Regular updates** - Keep system and packages updated
4. **Environment variables** - Never commit secrets to Git
5. **Backups** - Set up automated backups for database and files
6. **Monitoring** - Use CloudWatch or similar for alerts

---

## SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is enabled by default
# Test renewal
sudo certbot renew --dry-run
```

Update Nginx config to use HTTPS and update `VITE_WS_URL` to `wss://your-domain.com`
