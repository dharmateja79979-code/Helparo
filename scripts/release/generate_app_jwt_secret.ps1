param(
  [string]$EnvPath = "apps/api/.env",
  [int]$NumBytes = 48
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $EnvPath)) {
  throw "Env file not found: $EnvPath"
}

# Generate a cryptographically strong secret and format as base64url.
$bytes = New-Object byte[] $NumBytes
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
$secret = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')

$raw = Get-Content $EnvPath -Raw
if ($raw -match "(?m)^APP_JWT_SECRET=") {
  $updated = [Regex]::Replace($raw, "(?m)^APP_JWT_SECRET=.*$", "APP_JWT_SECRET=$secret")
} else {
  $updated = $raw.TrimEnd() + "`r`nAPP_JWT_SECRET=$secret`r`n"
}

Set-Content -Path $EnvPath -Value $updated -NoNewline

Write-Host "Generated and updated APP_JWT_SECRET in $EnvPath"
