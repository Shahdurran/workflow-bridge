# Deployment Guide
## Multi-Platform Workflow Automation SaaS

This guide covers deploying all 5 services of the workflow automation platform.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Load Balancer / Nginx              │
│             (SSL Termination, Routing)               │
└──────────┬──────────────────────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────┐   ┌─────────────────┐
│ Frontend│   │  Backend API    │
│ (React) │   │  (FastAPI)      │
│ Port    │   │  Port 8000      │
│ 3000    │   │                 │
└─────────┘   └────┬────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼────┐       ┌─────▼──────┐
    │ n8n-MCP │       │  make-MCP  │
    │ Port    │       │  Port 3002 │
    │ 3001    │       │            │
    └────┬────┘       └─────┬──────┘
         │                  │
         └────────┬─────────┘
                  │
         ┌────────▼──────────┐
         │workflow-translator│
         │   Port 3003       │
         └───────────────────┘
```

---

## Prerequisites

- Docker & Docker Compose (20.10+)
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)
- 4GB RAM minimum (8GB recommended)
- SSL certificates (for production)

---

## Quick Start (Docker Compose)

### 1. Clone and Configure

```bash
cd workflow-bridge

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 2. Build and Start All Services

```bash
# Build all Docker images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service health
docker-compose ps
```

### 3. Verify Deployment

```bash
# Check all services are healthy
curl http://localhost:8000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3000/health

# Test frontend
open http://localhost:3000

# Access API docs
open http://localhost:8000/docs
```

---

## Environment Variables

### Required Variables

```bash
# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# AI Services (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# n8n Instance
N8N_HOST=http://your-n8n-instance:5678
N8N_API_KEY=your_n8n_api_key

# JWT Security
JWT_SECRET_KEY=generate-a-secure-random-key-here
```

### Optional Variables

```bash
# Models
OPENAI_MODEL=gpt-4-turbo-preview
CLAUDE_MODEL=claude-sonnet-4-20250514

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOG_LEVEL=info
DEBUG=false
```

---

## Production Deployment

### Option 1: Docker Compose (VPS/EC2)

**1. Server Setup**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
sudo mkdir -p /opt/workflow-bridge
cd /opt/workflow-bridge
```

**2. Deploy Application**

```bash
# Clone repository
git clone https://github.com/your-repo/workflow-bridge.git .

# Configure environment
sudo nano .env

# Start services
sudo docker-compose up -d

# Enable auto-restart
sudo docker-compose up -d --remove-orphans
```

**3. Setup Nginx Reverse Proxy**

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/workflow-bridge
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/workflow-bridge /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

**4. Setup SSL with Let's Encrypt**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (already setup by certbot)
sudo systemctl status certbot.timer
```

### Option 2: Railway Deployment

**1. Install Railway CLI**

```bash
npm install -g @railway/cli
railway login
```

**2. Deploy Each Service**

```bash
# n8n-MCP
cd n8n-mcp
railway init
railway up

# make-MCP
cd ../make-mcp
railway init
railway up

# workflow-translator
cd ../workflow-translator
railway init
railway up

# Backend API
cd ../automation-chatbot-backend
railway init
railway up

# Frontend
cd ../automation-chatbot-frontend
railway init
railway up
```

**3. Configure Environment Variables**

In Railway dashboard:
- Add all environment variables
- Link services (set service URLs)
- Configure domains

### Option 3: AWS ECS/Fargate

**1. Build and Push Docker Images**

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

# Build and tag images
docker build -t workflow-bridge/n8n-mcp ./n8n-mcp
docker build -t workflow-bridge/make-mcp ./make-mcp
docker build -t workflow-bridge/translator ./workflow-translator
docker build -t workflow-bridge/backend ./automation-chatbot-backend
docker build -t workflow-bridge/frontend ./automation-chatbot-frontend

# Tag for ECR
docker tag workflow-bridge/backend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/backend:latest

# Push images
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/backend:latest
# ... repeat for all services
```

**2. Create ECS Task Definitions**

Use the provided `docker-compose.yml` as reference for:
- Environment variables
- Port mappings
- Health checks
- Dependencies

**3. Deploy with ECS Service**

```bash
# Create cluster
aws ecs create-cluster --cluster-name workflow-bridge

# Create services
aws ecs create-service \
  --cluster workflow-bridge \
  --service-name backend \
  --task-definition backend:1 \
  --desired-count 2 \
  --launch-type FARGATE
```

---

## Service-Specific Deployment

### n8n-MCP

```bash
cd n8n-mcp
npm install
npm run build
npm start

# Or with Docker
docker build -t n8n-mcp .
docker run -p 3001:3001 -e N8N_HOST=http://n8n:5678 n8n-mcp
```

### make-MCP

```bash
cd make-mcp
npm install
npm run build
npm run rebuild  # Initialize database
npm start

# Or with Docker
docker build -t make-mcp .
docker run -p 3002:3002 -v make-data:/app/data make-mcp
```

### workflow-translator

```bash
cd workflow-translator
npm install
npm run build
npm start

# Or with Docker
docker build -t workflow-translator .
docker run -p 3003:3003 -e ANTHROPIC_API_KEY=your-key workflow-translator
```

### Backend API

```bash
cd automation-chatbot-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Or with Docker
docker build -t backend .
docker run -p 8000:8000 --env-file .env backend
```

### Frontend

```bash
cd automation-chatbot-frontend
npm install
npm run build
npm run preview

# Or with Docker
docker build -t frontend .
docker run -p 3000:3000 frontend
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Automated health check script
#!/bin/bash
services=("3001" "3002" "3003" "8000" "3000")
for port in "${services[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health)
  if [ $status -eq 200 ]; then
    echo "✓ Port $port: Healthy"
  else
    echo "✗ Port $port: Unhealthy ($status)"
  fi
done
```

### Logs

```bash
# Docker Compose logs
docker-compose logs -f --tail=100

# Specific service
docker-compose logs -f backend

# Save logs
docker-compose logs > logs-$(date +%Y%m%d).txt
```

### Backup Database

```bash
# Supabase backups (automatic daily)
# Manual backup via Supabase dashboard

# Backup Make-MCP database
docker-compose exec make-mcp cp /app/data/make-modules.db /app/data/backup-$(date +%Y%m%d).db
```

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Check services
docker-compose ps
```

---

## Scaling

### Horizontal Scaling

```bash
# Scale backend API
docker-compose up -d --scale backend=3

# Load balance with Nginx upstream
upstream backend_api {
    server localhost:8000;
    server localhost:8001;
    server localhost:8002;
}
```

### Database Scaling

- Use Supabase connection pooling
- Enable read replicas
- Implement caching (Redis)

### MCP Services Scaling

- Deploy multiple instances behind load balancer
- Use sticky sessions for MCP connections
- Implement service discovery (Consul/etcd)

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs service-name

# Check ports
sudo netstat -tulpn | grep :8000

# Restart service
docker-compose restart service-name
```

### Database Connection Issues

```bash
# Verify Supabase credentials
curl -H "apikey: YOUR_KEY" https://your-project.supabase.co/rest/v1/

# Check network
docker-compose exec backend ping supabase.co
```

### High Memory Usage

```bash
# Check resource usage
docker stats

# Limit memory per service in docker-compose.yml
services:
  backend:
    mem_limit: 512m
    mem_reservation: 256m
```

### MCP Connection Failures

```bash
# Test MCP servers directly
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Check backend can reach MCP servers
docker-compose exec backend curl http://n8n-mcp:3001/health
```

---

## Security Checklist

- [ ] Change all default secrets and keys
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (UFW/Security Groups)
- [ ] Set up fail2ban for SSH
- [ ] Enable Docker security scanning
- [ ] Implement rate limiting
- [ ] Set up monitoring alerts
- [ ] Configure backup schedule
- [ ] Review and minimize exposed ports
- [ ] Enable database encryption at rest

---

## Performance Optimization

1. **Enable Caching**
   - Redis for session storage
   - CloudFlare for static assets

2. **Database Optimization**
   - Add indexes on frequently queried fields
   - Enable query caching
   - Use connection pooling

3. **CDN for Static Files**
   - Serve frontend through CDN
   - Cache API responses where appropriate

4. **Compression**
   - Enable gzip/brotli in Nginx
   - Compress API responses

---

## Cost Estimation (Monthly)

### Small Scale (< 1000 users)
- **VPS (DigitalOcean/Hetzner)**: $40-80
- **Supabase Free Tier**: $0
- **OpenAI API**: $20-50
- **Claude API**: $30-60
- **Total**: ~$90-190/month

### Medium Scale (1000-10000 users)
- **VPS or AWS ECS**: $150-300
- **Supabase Pro**: $25
- **OpenAI API**: $200-500
- **Claude API**: $100-300
- **Total**: ~$475-1,125/month

### Large Scale (10000+ users)
- **AWS ECS/EKS**: $500-1000
- **Supabase Team**: $599
- **OpenAI API**: $1000-3000
- **Claude API**: $500-1500
- **CDN**: $50-200
- **Total**: ~$2,649-6,299/month

---

## Support & Maintenance

- Monitor error logs daily
- Update dependencies monthly
- Review security patches weekly
- Backup data daily
- Test disaster recovery quarterly

---

**Last Updated**: 2024-01-15  
**Version**: 1.0  
**Status**: Production Ready ✅
