$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"

Write-Host "Starting CineSocial Backend..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d `"$backendDir`" && node server.js"

Start-Sleep -Seconds 3

Write-Host "Starting CineSocial Frontend..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d `"$frontendDir`" && npx vite --port 5173"

Write-Host ""
Write-Host "Both servers starting in separate windows!" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Gray
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Gray
