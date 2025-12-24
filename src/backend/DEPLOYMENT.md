# Deployment Guide

## Local Development

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Setup Steps
1. Install dependencies: `pip install -r requirements.txt`
2. Copy `.env.example` to `.env` and configure
3. Run: `python main.py`
4. Access: http://localhost:3000

## Production Deployment Options

### Option 1: Azure App Service (Recommended)

#### Deploy using Azure CLI
```bash
# Login to Azure
az login

# Create a resource group
az group create --name amigo-invisible-rg --location eastus

# Create an App Service plan
az appservice plan create \
  --name amigo-invisible-plan \
  --resource-group amigo-invisible-rg \
  --sku B1 \
  --is-linux

# Create a web app
az webapp create \
  --name amigo-invisible-api \
  --resource-group amigo-invisible-rg \
  --plan amigo-invisible-plan \
  --runtime "PYTHON:3.11"

# Configure environment variables
az webapp config appsettings set \
  --name amigo-invisible-api \
  --resource-group amigo-invisible-rg \
  --settings \
    API_KEY="your-secure-key" \
    ADMIN_API_KEY="your-admin-key" \
    REVEAL_DATE="2024-12-24T00:00:00Z" \
    PORT=8000

# Deploy the code
az webapp up \
  --name amigo-invisible-api \
  --resource-group amigo-invisible-rg
```

### Option 2: Docker Container

#### Create Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3000

CMD ["python", "main.py"]
```

#### Build and Run
```bash
# Build image
docker build -t amigo-invisible-api .

# Run container
docker run -d \
  -p 3000:3000 \
  -e API_KEY="your-secure-key" \
  -e ADMIN_API_KEY="your-admin-key" \
  -e REVEAL_DATE="2024-12-24T00:00:00Z" \
  -v $(pwd)/data:/app/data \
  --name amigo-invisible \
  amigo-invisible-api
```

### Option 3: Azure Container Instances

```bash
# Create container instance
az container create \
  --resource-group amigo-invisible-rg \
  --name amigo-invisible-api \
  --image amigo-invisible-api \
  --dns-name-label amigo-invisible \
  --ports 3000 \
  --environment-variables \
    API_KEY="your-secure-key" \
    ADMIN_API_KEY="your-admin-key" \
    REVEAL_DATE="2024-12-24T00:00:00Z"
```

### Option 4: Azure Functions (Serverless)

Requires some code modifications to work with Azure Functions. Contact for implementation details.

### Option 5: Traditional Server (Linux)

#### Using systemd service
```bash
# Install Python and dependencies
sudo apt update
sudo apt install python3 python3-pip

# Clone or copy your code
cd /opt/amigo-invisible
pip3 install -r requirements.txt

# Create .env file
nano .env

# Create systemd service
sudo nano /etc/systemd/system/amigo-invisible.service
```

Service file content:
```ini
[Unit]
Description=Amigo Invisible Bingo API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/amigo-invisible
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/python3 main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl daemon-reload
sudo systemctl enable amigo-invisible
sudo systemctl start amigo-invisible

# Setup nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/amigo-invisible
```

Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Environment Variables

Set these in your deployment environment:

| Variable | Description | Example |
|----------|-------------|---------|
| API_KEY | Main API key for authentication | `secure-random-string-123` |
| ADMIN_API_KEY | Admin-only operations key | `admin-secure-key-456` |
| REVEAL_DATE | Date when results can be revealed | `2024-12-24T00:00:00Z` |
| PORT | Port number for the server | `3000` |
| CORS_ORIGINS | Allowed frontend origins | `https://yourdomain.com` |

## Security Checklist

- [ ] Generate strong, unique API keys
- [ ] Use HTTPS in production
- [ ] Configure CORS to only allow your frontend domain
- [ ] Set up proper firewall rules
- [ ] Enable logging and monitoring
- [ ] Regular security updates
- [ ] Backup data directory regularly
- [ ] Use environment variables for secrets (never commit .env)

## Monitoring

### Health Check
```bash
curl https://your-api-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-19T10:30:00Z",
  "version": "0.0.21"
}
```

### Logging
- Check application logs for errors
- Monitor API response times
- Track failed authentication attempts

## Backup Strategy

### Data Files
```bash
# Backup predictions and answers
tar -czf backup-$(date +%Y%m%d).tar.gz data/
```

### Automated Backup (cron)
```bash
# Add to crontab
0 2 * * * cd /opt/amigo-invisible && tar -czf /backups/amigo-$(date +\%Y\%m\%d).tar.gz data/
```

## Troubleshooting

### Server won't start
- Check Python version: `python --version`
- Verify dependencies: `pip install -r requirements.txt`
- Check .env file exists and is readable
- Verify port is not in use: `netstat -an | grep 3000`

### Authentication errors
- Verify API keys in .env match client configuration
- Check header format: `X-API-Key` (case-sensitive)

### CORS errors
- Update CORS_ORIGINS in .env
- Restart server after configuration changes

## Performance

For better performance in production:
- Use Gunicorn with multiple workers
- Enable response compression
- Implement caching for static data
- Use a CDN for frontend assets

Example with Gunicorn:
```bash
pip install gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:3000
```

## Scaling

For high traffic:
- Deploy multiple instances behind a load balancer
- Use a shared database (PostgreSQL, MongoDB)
- Implement Redis for caching
- Use Azure Front Door or Cloudflare for DDoS protection
