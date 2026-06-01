$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

function Get-Python312 {
    $candidates = @(
        ,@("python3.12"),
        ,@("py", "-3.12"),
        ,@("python")
    )
    foreach ($candidate in $candidates) {
        try {
            $command = $candidate[0]
            $arguments = @()
            if ($candidate.Length -gt 1) {
                $arguments = $candidate[1..($candidate.Length - 1)]
            }
            $version = & $command @arguments --version 2>$null
            if ($version -match "Python 3\.12") {
                return ,$candidate
            }
        } catch {
        }
    }
    throw "Python 3.12 not found. Install Python 3.12 and retry."
}

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    $python = Get-Python312
    Write-Host "Creating .venv with $($python -join ' ')"
    $command = $python[0]
    $arguments = @()
    if ($python.Length -gt 1) {
        $arguments = $python[1..($python.Length - 1)]
    }
    & $command @arguments -m venv .venv
}

Write-Host "Installing backend dependencies"
& ".\.venv\Scripts\python.exe" -m pip install --upgrade pip
& ".\.venv\Scripts\python.exe" -m pip install -r ".\backend\requirements-dev.txt"

Write-Host "Installing frontend dependencies"
Set-Location (Join-Path $Root "frontend")
npm install

Write-Host "Setup complete"
