param(
    [switch]$RunLocal
)

$version = "0.0.28" 

$registry = "crgarbingoacr.azurecr.io/"
$backendImage = $registry + "bingo-backend:" + $version
$backendImageLatest = $registry + "bingo-backend:latest"
$frontendImage = $registry +"bingo-frontend:" + $version
$frontendImageLatest = $registry +"bingo-frontend:latest"

# Always build both containers first
Write-Host "🔨 Building backend container..." -ForegroundColor Cyan
Set-Location backend
docker build -t $backendImage -t $backendImageLatest -f Dockerfile .
Set-Location ..

Write-Host "🔨 Building frontend container..." -ForegroundColor Cyan
Set-Location frontend
docker build -t $frontendImage -t $frontendImageLatest -f Dockerfile .
Set-Location ..

if ($RunLocal) {
    Write-Host "🚀 Starting local development environment..." -ForegroundColor Green
    
    # Stop and remove existing backend container if running
    docker stop bingo-backend 2>$null
    docker rm bingo-backend 2>$null
    
    Write-Host "📦 Starting backend container..." -ForegroundColor Cyan
    docker run -d --name bingo-backend -p 3000:80 --restart unless-stopped $backendImageLatest
    
    # Wait a moment for backend to start
    Start-Sleep -Seconds 3
    Write-Host "✅ Backend container started on http://localhost:3000" -ForegroundColor Green
    
    # Start frontend with npm
    Write-Host "🎨 Starting frontend..." -ForegroundColor Cyan
    Set-Location frontend
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    Set-Location ..
    
    Write-Host "✅ Frontend will start on http://localhost:5173" -ForegroundColor Green
    Write-Host "🎉 Local environment is running!" -ForegroundColor Green
    
    exit 0
}

# Deploy to Azure
az acr login --name $registry.TrimEnd('/')

# Push images to Azure Container Registry
Write-Host "📤 Pushing images to Azure Container Registry..." -ForegroundColor Cyan
docker push $backendImage
docker push $backendImageLatest
docker push $frontendImage
docker push $frontendImageLatest

# Update Azure Web Apps to use the new images
Write-Host "🚀 Deploying to Azure Web Apps..." -ForegroundColor Cyan

$webappName = "crgar-bingo-api"
$resourceGroup = "crgar-bingo-rg"
$imageName = $backendImage
az webapp config container set --name $webappName --resource-group $resourceGroup --container-image-name $imageName --container-registry-url https://crgarbingoacr.azurecr.io
az webapp restart --name $webappName --resource-group $resourceGroup
az webapp show --name $webappName --resource-group $resourceGroup --query "siteConfig.linuxFxVersion" -o tsv


$webappName = "bingo"
$resourceGroup = "crgar-bingo-rg"
$imageName = $frontendImage
az webapp config container set --name $webappName --resource-group $resourceGroup --container-image-name $imageName --container-registry-url https://crgarbingoacr.azurecr.io
az webapp restart --name $webappName --resource-group $resourceGroup
az webapp show --name $webappName --resource-group $resourceGroup --query "siteConfig.linuxFxVersion" -o tsv