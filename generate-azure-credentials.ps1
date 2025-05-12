# Login to Azure
az login

# Get the subscription ID
$subscriptionId = az account show --query id -o tsv

# Create a service principal
$sp = az ad sp create-for-rbac --name "RustPermissionsManager" --role contributor --scopes /subscriptions/$subscriptionId --sdk-auth

# Output the credentials
Write-Host "Add these credentials to your GitHub repository secrets as AZURE_CREDENTIALS:"
Write-Host $sp 