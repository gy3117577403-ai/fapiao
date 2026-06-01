$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    & "$PSScriptRoot\setup.ps1"
    Set-Location $Root
}

& ".\.venv\Scripts\python.exe" -m pytest

Set-Location (Join-Path $Root "frontend")
npm run build
