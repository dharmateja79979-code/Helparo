$ErrorActionPreference = "Stop"

function Test-EnvFile {
  param(
    [string]$Path,
    [string[]]$RequiredKeys
  )
  if (!(Test-Path $Path)) {
    Write-Host "[FAIL] Missing $Path"
    return $false
  }
  $raw = Get-Content $Path -Raw
  $ok = $true
  foreach ($k in $RequiredKeys) {
    if ($raw -notmatch "(?m)^$k=") {
      Write-Host "[FAIL] $Path missing key: $k"
      $ok = $false
    }
  }
  if ($raw -match "replace-with-strong-secret|your-project|your-anon-key|your-supabase|change-this-app-jwt-secret") {
    Write-Host "[WARN] Placeholder values detected in $Path"
  }
  if ($ok) { Write-Host "[OK] $Path" }
  return $ok
}

$apiRequired = @(
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "APP_JWT_SECRET"
)

$mobileRequired = @(
  "API_BASE_URL",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY"
)

$apiOk = Test-EnvFile -Path "apps/api/.env" -RequiredKeys $apiRequired
$mobileOk = Test-EnvFile -Path "apps/mobile/.env" -RequiredKeys $mobileRequired

if (!($apiOk -and $mobileOk)) {
  Write-Host "`nEnvironment audit failed."
  exit 1
}

Write-Host "`nEnvironment audit passed."
