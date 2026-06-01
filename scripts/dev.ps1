$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

& "$PSScriptRoot\setup.ps1"

$backendScript = Join-Path $PSScriptRoot "start-backend.ps1"
$frontendScript = Join-Path $PSScriptRoot "start-frontend.ps1"

Start-Process powershell -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-File", $backendScript) -WorkingDirectory $Root
Start-Process powershell -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-File", $frontendScript) -WorkingDirectory $Root

Start-Sleep -Seconds 4
Start-Process "http://127.0.0.1:5173"
