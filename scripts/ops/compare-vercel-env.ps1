param(
  [string]$Environment = "development",
  [string]$SchemaFile = ".env.example",
  [string]$OutputFile = "",
  [switch]$KeepPulledFile
)

$ErrorActionPreference = "Stop"

function Get-EnvKeys {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if (-not (Test-Path $Path)) {
    throw "Environment file not found: $Path"
  }

  return Get-Content $Path |
    Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=' } |
    ForEach-Object { ($_ -split '=', 2)[0].Trim() } |
    Sort-Object -Unique
}

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  throw "Vercel CLI is required. Install it and run 'vercel link' first."
}

if (-not $OutputFile) {
  $OutputDirectory = ".vercel"

  if (-not (Test-Path $OutputDirectory)) {
    New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
  }

  $OutputFile = Join-Path $OutputDirectory ".env.compare.$Environment.local"
}

$SchemaKeys = Get-EnvKeys -Path $SchemaFile

Write-Host "Pulling remote environment variables for '$Environment'..." -ForegroundColor Cyan
vercel env pull $OutputFile --environment=$Environment --yes | Out-Null

$RemoteKeys = Get-EnvKeys -Path $OutputFile

$MissingInRemote = $SchemaKeys | Where-Object { $_ -notin $RemoteKeys }
$ExtraInRemote = $RemoteKeys | Where-Object { $_ -notin $SchemaKeys }

Write-Host ""
Write-Host "Environment schema file: $SchemaFile" -ForegroundColor DarkGray
Write-Host "Remote comparison file: $OutputFile" -ForegroundColor DarkGray
Write-Host ""

if ($MissingInRemote.Count -eq 0 -and $ExtraInRemote.Count -eq 0) {
  Write-Host "Remote Vercel environment matches .env.example key declarations." -ForegroundColor Green
} else {
  if ($MissingInRemote.Count -gt 0) {
    Write-Host "Missing in remote '$Environment':" -ForegroundColor Yellow
    $MissingInRemote | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
  }

  if ($ExtraInRemote.Count -gt 0) {
    Write-Host "Present in remote '$Environment' but not declared in .env.example:" -ForegroundColor Yellow
    $ExtraInRemote | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
  }

  if (-not $KeepPulledFile) {
    Remove-Item $OutputFile -ErrorAction SilentlyContinue
  }

  exit 1
}

if (-not $KeepPulledFile) {
  Remove-Item $OutputFile -ErrorAction SilentlyContinue
}
