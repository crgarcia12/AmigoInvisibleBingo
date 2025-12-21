# Amigo Invisible Bingo

## Quick Start - Local Development

To run the application locally:

```powershell
.\build.ps1 -RunLocal
```

This will:
- ✅ Start the backend API in a Docker container on http://localhost:3000
- ✅ Start the frontend development server on http://localhost:5173

## Deployment to Azure

To build and deploy to Azure:

```powershell
.\build.ps1
```

This will:
1. Build Docker images for frontend and backend
2. Push images to Azure Container Registry
3. Update Azure Web Apps with new images
4. Restart the services

## Project Structure

- `/backend` - FastAPI backend with Cosmos DB
- `/frontend` - React + TypeScript frontend with Vite
- `build.ps1` - Build and deployment script

## Features

- 🎮 Amigo Invisible (Secret Santa) prediction game
- 📝 Quiz system with server-side validation
- 🔐 Answer tracking and scoring
- 🎯 Progressive quiz (resume where you left off)
- 📊 Real-time participant status

## Requirements

### For Local Development:
- Docker Desktop
- Node.js 18+
- PowerShell

### For Azure Deployment:
- Azure CLI
- Access to Azure Container Registry
- Azure Web Apps configured

## Environment Variables

Backend requires:
- `COSMOS_ENDPOINT` - Cosmos DB connection
- `COSMOS_KEY` - Cosmos DB key
- `REVEAL_DATE` - Date when results are revealed

Frontend requires:
- `VITE_API_URL` - Backend API URL
