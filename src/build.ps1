$version = "0.0.10" 

$registry = "crgarbingoacr.azurecr.io/"
$backendImage = $registry + "bingo-backend:" + $version
$frontendImage = $registry +"bingo-frontend:" + $version

az acr login --name $registry.TrimEnd('/')

# Build and push frontend and backend images
cd frontend
docker build -t $frontendImage -f Dockerfile .
docker push $frontendImage
cd ../backend
docker build -t $backendImage -f Dockerfile .
docker push $backendImage
cd ..

# Update Azure Web Apps to use the new images

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