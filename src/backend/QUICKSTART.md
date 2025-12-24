# 🚀 Quick Start Guide - Amigo Invisible Bingo Backend

## Windows Setup (Simplified)

### One-Command Start

```batch
# Login to ACR
az acr login --name crgarbingoacr

$version = "0.0.28"
$imageName = "crgarbingoacr.azurecr.io/bingo-backend:$version"
docker build -t $imageName .
docker push $imageName

docker run -d -p 3000:3000 `
  -e COSMOS_ENDPOINT="https://crgar-bingo-db.documents.azure.com:443/" `
  -e COSMOS_KEY="" `
  -e COSMOS_DATABASE="AmigoInvisibleDB" `
  -e COSMOS_CONTAINER="Predictions" `
  --name bingo-backend `
  $imageName
```

### What You Get

- **API Server**: http://localhost:3000
- **Documentation**: http://localhost:3000/docs
- **Database**: Azure Cosmos DB (crgar-bingo-db)
- **Auto-created**: Database and container created automatically

---

## Your First Request

Once running, test with:

```bash
# Health check (no authentication)
curl http://localhost:3000/api/health

# Or open in browser
http://localhost:3000/docs
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-19T10:30:00Z",
  "version": "0.0.28"
}
```

## Submit Your First Prediction

```bash
curl -X POST http://localhost:3000/api/predictions \
  -H "X-API-Key: your-secure-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "Paula",
    "predictions": {
      "Miriam": "Paula",
      "Paula": "Diego",
      "Adriana": "Carlos A",
      "Lula": "Padrino",
      "Diego": "Adriana",
      "Carlos A": "Lula",
      "Padrino": "Miriam"
    }
  }'
```

## 📚 Documentation Quick Links

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Main documentation & API examples |
| [DOCKER.md](DOCKER.md) | Complete Docker guide |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment to Azure/servers |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Technical implementation details |

## 🔑 Configuration

### API Keys (Optional - Defaults Provided)

You can customize API keys by editing `.env` file:

```env
API_KEY=your-secure-api-key-here
ADMIN_API_KEY=your-secure-admin-key-here
REVEAL_DATE=2024-12-24T00:00:00Z
PORT=3000
CORS_ORIGINS=http://localhost:5173
```

### Database Credentials (Hardcoded)

Already configured in `config.py`:
- **Endpoint**: https://crgar-bingo-db.documents.azure.com:443/
- **Database**: AmigoInvisibleDB
- **Container**: Predictions

## 🧪 Testing

```bash
# Test the API
python test_api.py

# Or manually test each endpoint
curl http://localhost:3000/api/health
```

## 📊 View API Documentation

Interactive documentation available at:
- **Swagger UI**: http://localhost:3000/docs
- **ReDoc**: http://localhost:3000/redoc

## 🔧 Troubleshooting

### Port already in use
```bash
# Windows - find what's using port 3000
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Solution: Change PORT in .env or stop the other service
```

### Docker not starting
```bash
# View detailed logs
docker-compose logs

# Rebuild
docker-compose down
docker-compose up --build
```

### Can't connect to API
1. Check if service is running: `docker-compose ps` or `netstat -an | findstr 3000`
2. Verify URL: http://localhost:3000 (not https)
3. Check firewall settings

### Authentication errors
1. Verify .env file exists
2. Check API_KEY matches in your requests
3. Use header name `X-API-Key` (case-sensitive)

## 🎯 Next Steps

1. ✅ **Start the server** (using Docker or Python)
2. ✅ **Test health endpoint**: http://localhost:3000/api/health
3. ✅ **View API docs**: http://localhost:3000/docs
4. ✅ **Submit test prediction** using curl or the docs interface
5. ✅ **Integrate with frontend** using the API

## 📞 Need Help?

Check the documentation:
- General usage → [README.md](README.md)
- Docker issues → [DOCKER.md](DOCKER.md)
- Deployment → [DEPLOYMENT.md](DEPLOYMENT.md)
- Architecture → [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

## 🌐 Deployment to Production

### Quick Deploy to Azure

```bash
# Docker method (easiest)
docker build -t amigo-invisible-api .
docker tag amigo-invisible-api youracr.azurecr.io/amigo-invisible-api
docker push youracr.azurecr.io/amigo-invisible-api

# See DEPLOYMENT.md for complete Azure setup
```

### Cloud Options
- ✅ **Azure Container Instances** (simplest)
- ✅ **Azure App Service** (managed)
- ✅ **Azure Container Apps** (modern)
- ✅ **Azure Kubernetes Service** (scalable)

Full deployment instructions in [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📋 Checklist Before Production

- [ ] Changed default API keys in .env
- [ ] Set correct REVEAL_DATE
- [ ] Updated CORS_ORIGINS to your domain
- [ ] Tested all endpoints
- [ ] Set up HTTPS
- [ ] Configured backups for data/ directory
- [ ] Set up monitoring/logging
- [ ] Documented your specific deployment

---

**Ready to go! Choose your deployment method above and get started! 🚀**
