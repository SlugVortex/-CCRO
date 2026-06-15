# Azure Deployment Guide

This project is set up to deploy in two pieces:

- Frontend: Azure Storage static website
- Backend: Azure App Service (Linux, Python 3.11)

The GitHub Actions workflows deploy directly to Azure. They do not use the GitHub artifact upload or download steps.

## 1. Create or confirm your GitHub repository

Push this project to a GitHub repository first.

## 2. Azure resources to create

Run these commands in Azure CLI after logging in and selecting your subscription.

```bash
az account set --subscription 0616016a-7955-457f-aa6c-3efb5240d67b
```

### Frontend static website

```bash
az storage account create \
  --name ccrofrontendstatic \
  --resource-group carib-climate \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

az storage blob service-properties update \
  --account-name ccrofrontendstatic \
  --resource-group carib-climate \
  --static-website \
  --index-document index.html \
  --404-document 404.html
```

### Backend App Service

```bash
az appservice plan create \
  --name ccro-backend-plan \
  --resource-group carib-climate \
  --location eastus \
  --sku B1 \
  --is-linux

az webapp create \
  --name ccro-backend-api \
  --resource-group carib-climate \
  --plan ccro-backend-plan \
  --runtime "PYTHON:3.11"
```

## 3. Create a service principal for GitHub Actions

```bash
az ad sp create-for-rbac \
  --name ccro-github-actions \
  --role contributor \
  --scopes /subscriptions/0616016a-7955-457f-aa6c-3efb5240d67b/resourceGroups/carib-climate \
  --sdk-auth
```

Copy the full JSON output into the GitHub secret named `AZURE_CREDENTIALS`.

## 4. Grant storage data-plane access to that service principal

This is required so the frontend workflow can upload directly into the `$web` container.

```bash
az role assignment create \
  --assignee <APP_ID_FROM_AZURE_CREDENTIALS_JSON> \
  --role "Storage Blob Data Contributor" \
  --scope /subscriptions/0616016a-7955-457f-aa6c-3efb5240d67b/resourceGroups/carib-climate/providers/Microsoft.Storage/storageAccounts/ccrofrontendstatic
```

## 5. GitHub secrets to create

Create these repository secrets in GitHub.

### Core deployment secrets

- `AZURE_CREDENTIALS`
- `AZURE_RESOURCE_GROUP`
- `AZURE_STORAGE_ACCOUNT`
- `AZURE_BACKEND_WEBAPP_NAME`
- `VITE_API_BASE_URL`
- `VITE_AZURE_MAPS_KEY`
- `VITE_AZURE_MAPS_CLIENT_ID`
- `CORS_ORIGINS`

### Backend runtime secrets

- `ENABLE_AZURE_OPENAI`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_DEPLOYMENT`
- `AZURE_OPENAI_API_VERSION`
- `FOUNDRY_PROJECT_ENDPOINT`
- `FOUNDRY_API_KEY`
- `FOUNDRY_AGENT_ID`
- `FOUNDRY_KNOWLEDGE_BASE_NAME`
- `AZURE_SEARCH_ENDPOINT`
- `AZURE_SEARCH_ADMIN_KEY`
- `AZURE_SEARCH_INDEX_NAME`
- `FABRIC_SEMANTIC_MODEL_ID`
- `POWERBI_TENANT_ID`
- `POWERBI_CLIENT_ID`
- `POWERBI_CLIENT_SECRET`
- `POWERBI_WORKSPACE_ID`
- `POWERBI_REPORT_ID`
- `AZURE_MAPS_CLIENT_ID`
- `AZURE_MAPS_KEY`
- `KEY_VAULT_URI`

## 6. Exact values to use

Use these patterns:

- `AZURE_RESOURCE_GROUP`: `carib-climate`
- `AZURE_STORAGE_ACCOUNT`: `ccrofrontendstatic`
- `AZURE_BACKEND_WEBAPP_NAME`: `ccro-backend-api`
- `VITE_API_BASE_URL`: `https://ccro-backend-api.azurewebsites.net/api/v1`
- `ENABLE_AZURE_OPENAI`: `true`

For the Azure and Foundry values, copy them from the working local `.env`.

For `CORS_ORIGINS`, first get the real frontend site URL:

```bash
az storage account show \
  --name ccrofrontendstatic \
  --resource-group carib-climate \
  --query "primaryEndpoints.web" \
  -o tsv
```

Then set:

- `CORS_ORIGINS`: `<REAL_FRONTEND_URL>,http://localhost:5173`

## 7. Push to deploy

Once the secrets exist, push to `main`.

```bash
git add .
git commit -m "Prepare Azure deployment workflows"
git push -u origin main
```

The workflows created are:

- `.github/workflows/deploy-frontend-storage.yml`
- `.github/workflows/deploy-backend-webapp.yml`

## 8. Post-deploy checks

Backend health:

```bash
curl https://ccro-backend-api.azurewebsites.net/api/v1/health
```

Frontend site:

Open the static website endpoint shown by:

```bash
az storage account show \
  --name ccrofrontendstatic \
  --resource-group carib-climate \
  --query "primaryEndpoints.web" \
  -o tsv
```
