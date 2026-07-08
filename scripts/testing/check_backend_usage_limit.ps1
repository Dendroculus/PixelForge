<#
.SYNOPSIS
    Tests PixelForge backend feature usage limiting.

.DESCRIPTION
    This script verifies that the backend returns the structured RATE_LIMITED
    response when AI feature quotas are exhausted.

    The backend increments usage during the feature-specific /start flow, not
    during /init. To keep this test fast and avoid Azure uploads or Replicate
    calls, this script temporarily seeds the local usage table to each feature
    limit, calls /init, validates the structured error response, then restores
    the previous current-hour usage rows.

    Intended for local development only.

.PARAMETER ApiBase
    Base API URL for the backend.

.PARAMETER Features
    AI features whose usage limits should be tested.

.PARAMETER ClientIp
    Client IP key used by the backend usage limiter. For local Uvicorn tests,
    this is usually 127.0.0.1.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_usage_limit.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_usage_limit.ps1 `
      -Features upscale,rembg,colorrestore,objectremove
#>

param(
    [string]$ApiBase = "http://127.0.0.1:8000/api",

    [ValidateSet("upscale", "rembg", "colorrestore", "objectremove")]
    [string[]]$Features = @("upscale", "rembg", "colorrestore", "objectremove"),

    [string]$ClientIp = "127.0.0.1"
)

$ErrorActionPreference = "Stop"

function Write-Pass {
    param([string]$Message)
    Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Stop-Test {
    param([string]$Message)
    Write-Fail $Message
    throw $Message
}

function Get-FeatureLimit {
    param(
        [object]$Limits,
        [string]$SelectedFeature
    )

    $Property = $Limits.features.PSObject.Properties[$SelectedFeature]

    if ($null -eq $Property) {
        Stop-Test "Feature '$SelectedFeature' was not found in /limits response."
    }

    return [int]$Property.Value
}

function Get-BackendPython {
    $VenvPython = Join-Path (Get-Location) "backend\venv\Scripts\python.exe"

    if (Test-Path $VenvPython) {
        return $VenvPython
    }

    return "python"
}

function Invoke-UsageSeedPython {
    param(
        [string]$PythonPath,
        [string]$TempScriptPath,
        [string]$Mode,
        [string]$UsageKey,
        [int]$Limit,
        [string]$StatePath
    )

    & $PythonPath $TempScriptPath `
        --mode $Mode `
        --usage-key $UsageKey `
        --limit $Limit `
        --state-path $StatePath

    if ($LASTEXITCODE -ne 0) {
        Stop-Test "Usage database helper failed in mode '$Mode' for '$UsageKey'."
    }
}

function Invoke-ApiPostJson {
    param(
        [string]$Url,
        [string]$JsonFilePath
    )

    $CurlOutput = curl.exe -sS -w "`n%{http_code}" `
        -X POST "$Url" `
        -H "Content-Type: application/json" `
        --data-binary "@$JsonFilePath" 2>&1

    if ($LASTEXITCODE -ne 0) {
        Stop-Test "curl.exe failed while calling '$Url'. Output: $CurlOutput"
    }

    $Lines = $CurlOutput -split "`n"

    if ($Lines.Count -lt 1) {
        Stop-Test "Empty response from '$Url'."
    }

    $StatusCodeText = $Lines[$Lines.Count - 1].Trim()

    if (-not ($StatusCodeText -match "^\d{3}$")) {
        Stop-Test "Could not parse HTTP status code from response: $CurlOutput"
    }

    $BodyText = ""

    if ($Lines.Count -gt 1) {
        $BodyText = ($Lines[0..($Lines.Count - 2)] -join "`n").Trim()
    }

    $Body = $null

    if (-not [string]::IsNullOrWhiteSpace($BodyText)) {
        try {
            $Body = $BodyText | ConvertFrom-Json
        }
        catch {
            $Body = $null
        }
    }

    return [pscustomobject]@{
        StatusCode = [int]$StatusCodeText
        Body = $Body
        RawBody = $BodyText
    }
}

function Get-StructuredError {
    param([object]$Body)

    if ($null -eq $Body) {
        return [pscustomobject]@{
            Code = $null
            Message = $null
        }
    }

    if ($Body.PSObject.Properties.Name -contains "code") {
        return [pscustomobject]@{
            Code = $Body.code
            Message = $Body.message
        }
    }

    if ($Body.PSObject.Properties.Name -contains "detail") {
        $Detail = $Body.detail

        if ($Detail -is [string]) {
            return [pscustomobject]@{
                Code = $null
                Message = $Detail
            }
        }

        if ($Detail.PSObject.Properties.Name -contains "code") {
            return [pscustomobject]@{
                Code = $Detail.code
                Message = $Detail.message
            }
        }
    }

    return [pscustomobject]@{
        Code = $null
        Message = $null
    }
}

function Test-FeatureUsageLimit {
    param(
        [string]$SelectedFeature,
        [object]$Limits,
        [string]$PythonPath,
        [string]$SeedScriptPath,
        [string]$TempDir
    )

    $FeatureLimit = Get-FeatureLimit -Limits $Limits -SelectedFeature $SelectedFeature
    $UsageKey = "${ClientIp}:${SelectedFeature}"
    $StatePath = Join-Path $TempDir "usage-state-$SelectedFeature.json"
    $RequestJsonPath = Join-Path $TempDir "usage-limit-request-$SelectedFeature.json"

    Write-Host ""
    Write-Host "Testing feature: $SelectedFeature"
    Write-Host "Usage key      : $UsageKey"

    Write-Pass "Runtime limit for '$SelectedFeature' is $FeatureLimit uses."

    Invoke-UsageSeedPython `
        -PythonPath $PythonPath `
        -TempScriptPath $SeedScriptPath `
        -Mode "seed" `
        -UsageKey $UsageKey `
        -Limit $FeatureLimit `
        -StatePath $StatePath

    $script:SeededUsageStates += [pscustomobject]@{
        Feature = $SelectedFeature
        UsageKey = $UsageKey
        StatePath = $StatePath
    }

    Write-Pass "Seeded current-hour usage to the '$SelectedFeature' limit."

    $Usage = Invoke-RestMethod `
        -Uri "$ApiBase/usage?feature=$SelectedFeature" `
        -Method Get

    if ([int]$Usage.uses_remaining -ne 0) {
        Stop-Test (
            "Expected uses_remaining to be 0 for '$SelectedFeature', got " +
            "'$($Usage.uses_remaining)'. Check ClientIp parameter."
        )
    }

    Write-Pass "Usage endpoint reports 0 remaining uses."

    @{
        filename = "usage-limit-test-$SelectedFeature.png"
        cf_turnstile_response = "manual_test_bypass"
    } | ConvertTo-Json -Compress | Set-Content -NoNewline -Encoding UTF8 $RequestJsonPath

    $Response = Invoke-ApiPostJson `
        -Url "$ApiBase/$SelectedFeature/init" `
        -JsonFilePath $RequestJsonPath

    $ErrorPayload = Get-StructuredError -Body $Response.Body

    if ($Response.StatusCode -ne 429) {
        Stop-Test (
            "Expected HTTP 429 for '$SelectedFeature', got HTTP " +
            "$($Response.StatusCode). Raw: $($Response.RawBody)"
        )
    }

    Write-Pass "Init returned HTTP 429."

    if ($ErrorPayload.Code -ne "RATE_LIMITED") {
        Stop-Test (
            "Expected code 'RATE_LIMITED' for '$SelectedFeature', got " +
            "'$($ErrorPayload.Code)'."
        )
    }

    Write-Pass "Init returned code 'RATE_LIMITED'."

    if ($ErrorPayload.Message -ne "Usage limit reached for this feature.") {
        Stop-Test (
            "Unexpected RATE_LIMITED message for '$SelectedFeature': " +
            "'$($ErrorPayload.Message)'."
        )
    }

    Write-Pass "Init returned expected usage-limit message."
    Write-Pass "Usage limit test passed for '$SelectedFeature'."
}

$ApiBase = $ApiBase.TrimEnd("/")
$RunId = [guid]::NewGuid().ToString("N")
$TempDir = Join-Path $env:TEMP "pixelforge-usage-limit-$RunId"
$SeedScriptPath = Join-Path $TempDir "usage_limit_db_helper.py"
$script:SeededUsageStates = @()
$HasFailure = $false

try {
    New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

    @'
import argparse
import asyncio
import json
from pathlib import Path

import asyncpg


def load_database_url() -> str:
    env_path = Path("backend") / ".env"

    if not env_path.exists():
        raise RuntimeError("backend/.env not found.")

    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()

        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue

        key, value = stripped.split("=", 1)

        if key.strip() == "DATABASE_URL":
            return value.strip().strip('"').strip("'")

    raise RuntimeError("DATABASE_URL not found in backend/.env.")


async def seed_usage(usage_key: str, limit: int, state_path: Path) -> None:
    database_url = load_database_url()
    conn = await asyncpg.connect(database_url)

    try:
        previous = await conn.fetchrow(
            """
            SELECT usage_count
            FROM ip_usage_hourly
            WHERE ip_address = $1
              AND bucket_start = date_trunc('hour', NOW());
            """,
            usage_key,
        )

        state = {
            "usage_key": usage_key,
            "had_current_bucket": previous is not None,
            "previous_usage_count": previous["usage_count"] if previous else None,
        }

        state_path.write_text(json.dumps(state), encoding="utf-8")

        await conn.execute(
            """
            INSERT INTO ip_usage_hourly (ip_address, bucket_start, usage_count)
            VALUES ($1, date_trunc('hour', NOW()), $2)
            ON CONFLICT (ip_address, bucket_start)
            DO UPDATE SET usage_count = $2;
            """,
            usage_key,
            limit,
        )
    finally:
        await conn.close()


async def restore_usage(state_path: Path) -> None:
    if not state_path.exists():
        return

    database_url = load_database_url()
    state = json.loads(state_path.read_text(encoding="utf-8"))
    usage_key = state["usage_key"]

    conn = await asyncpg.connect(database_url)

    try:
        if state["had_current_bucket"]:
            await conn.execute(
                """
                UPDATE ip_usage_hourly
                SET usage_count = $2
                WHERE ip_address = $1
                  AND bucket_start = date_trunc('hour', NOW());
                """,
                usage_key,
                int(state["previous_usage_count"]),
            )
        else:
            await conn.execute(
                """
                DELETE FROM ip_usage_hourly
                WHERE ip_address = $1
                  AND bucket_start = date_trunc('hour', NOW());
                """,
                usage_key,
            )
    finally:
        await conn.close()


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["seed", "restore"], required=True)
    parser.add_argument("--usage-key", required=True)
    parser.add_argument("--limit", type=int, required=True)
    parser.add_argument("--state-path", required=True)

    args = parser.parse_args()
    state_path = Path(args.state_path)

    if args.mode == "seed":
        await seed_usage(args.usage_key, args.limit, state_path)
    else:
        await restore_usage(state_path)


if __name__ == "__main__":
    asyncio.run(main())
'@ | Set-Content -NoNewline -Encoding UTF8 $SeedScriptPath

    Write-Host ""
    Write-Host "PixelForge backend usage limit test"
    Write-Host "API base : $ApiBase"
    Write-Host "Features : $($Features -join ', ')"
    Write-Host "Client IP: $ClientIp"
    Write-Host ""

    $Limits = Invoke-RestMethod -Uri "$ApiBase/limits" -Method Get
    $PythonPath = Get-BackendPython

    foreach ($Feature in $Features) {
        Test-FeatureUsageLimit `
            -SelectedFeature $Feature `
            -Limits $Limits `
            -PythonPath $PythonPath `
            -SeedScriptPath $SeedScriptPath `
            -TempDir $TempDir
    }

    Write-Host ""
    Write-Pass "Backend usage limit test passed for all selected features."
}
catch {
    $HasFailure = $true
    Write-Fail $_.Exception.Message

    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
finally {
    $PythonPath = Get-BackendPython

    foreach ($State in $script:SeededUsageStates) {
        try {
            Invoke-UsageSeedPython `
                -PythonPath $PythonPath `
                -TempScriptPath $SeedScriptPath `
                -Mode "restore" `
                -UsageKey $State.UsageKey `
                -Limit 0 `
                -StatePath $State.StatePath

            Write-Pass "Restored previous usage state for '$($State.Feature)'."
        }
        catch {
            Write-Fail (
                "Failed to restore usage state for '$($State.Feature)': " +
                "$($_.Exception.Message)"
            )
            $HasFailure = $true
        }
    }

    if (Test-Path $TempDir) {
        Remove-Item $TempDir -Recurse -Force
    }

    if ($HasFailure) {
        exit 1
    }

    exit 0
}