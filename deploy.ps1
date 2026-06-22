# Bellissimo Couture - one-command production deploy (Windows / PowerShell)
#
# Run from the project root on the PROD server:
#   powershell -ExecutionPolicy Bypass -File .\deploy.ps1
#
# What it does, in order:
#   1. Pulls the latest code from GitHub (main)
#   2. Backend: installs deps, regenerates the Prisma client, applies DB migrations
#   3. Frontend: installs deps, rebuilds dist/ (served by IIS)
#   4. Restarts the API with pm2 so it loads the new code + Prisma client

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$PM2_APP = 'bellissimo-api'

function Run([string]$cmd) {
  Write-Host "`n>>> $cmd" -ForegroundColor Cyan
  Invoke-Expression $cmd
  if ($LASTEXITCODE -ne 0) { throw "Command failed (exit $LASTEXITCODE): $cmd" }
}

Write-Host '=== Bellissimo Couture deploy ===' -ForegroundColor Green

# 1) Latest code
Run 'git pull origin main'

# 2) Backend: deps + Prisma client + DB migrations
Set-Location (Join-Path $PSScriptRoot 'server')
Run 'npm install'
Run 'npx prisma generate'
Run 'npx prisma migrate deploy'

# 3) Frontend: deps + build (output -> client/dist, served by IIS)
Set-Location (Join-Path $PSScriptRoot 'client')
Run 'npm install'
Run 'npm run build'

# 4) Restart the API (loads new code + regenerated Prisma client)
Set-Location $PSScriptRoot
Run "pm2 restart $PM2_APP --update-env"
Run 'pm2 save'

Write-Host "`n=== Deploy complete ===" -ForegroundColor Green
Write-Host 'Tip: hard-refresh the site (Ctrl+F5) to bypass the browser cache.' -ForegroundColor Yellow
