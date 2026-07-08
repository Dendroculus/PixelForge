<#
.SYNOPSIS
    Smoke test for PixelForge public backend runtime endpoints.

.DESCRIPTION
    This script verifies the backend endpoints that should be safe, fast, and
    cheap to call during local development:

        - GET /api/limits
        - GET /api/usage?feature=upscale

    These tests do not upload files, do not start AI jobs, and do not call the
    remote AI provider. They are intended as the first backend health check
    before running heavier AI pipeline smoke tests.

.PARAMETER ApiBase
    Base API URL. Defaults to local FastAPI development server.

.PARAMETER Feature
    Feature used for the usage endpoint. Defaults to upscale.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/testing/backend_public_runtime_smoke.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/testing/backend_public_runtime_smoke.ps1 `
        -ApiBase "http://127.0.0.1:8000/api" `
        -Feature "upscale"
#>

param(
    [string]$ApiBase = "http://127.0.0.1:8000/api",
    [string]$Feature = "upscale"
)

$ErrorActionPreference = "Stop"
$script:Failed = 0
$ApiBase = $ApiBase.TrimEnd("/")

function Write-Section {
    param([string]$Message)

    Write-Host ""
    Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Write-Pass {
    param([string]$Message)

    Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)

    $script:Failed++
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Assert-Property {
    param(
        [Parameter(Mandatory = $true)]
        [object]$Object,

        [Parameter(Mandatory = $true)]
        [string]$PropertyName,

        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    if ($null -eq $Object) {
        Write-Fail "$Label is null."
        return
    }

    $hasProperty = $Object.PSObject.Properties.Name -contains $PropertyName

    if ($hasProperty) {
        Write-Pass "$Label has '$PropertyName'."
    }
    else {
        Write-Fail "$Label is missing '$PropertyName'."
    }
}

function Assert-AnyProperty {
    param(
        [Parameter(Mandatory = $true)]
        [object]$Object,

        [Parameter(Mandatory = $true)]
        [string[]]$PropertyNames,

        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    if ($null -eq $Object) {
        Write-Fail "$Label is null."
        return
    }

    $actualProperties = $Object.PSObject.Properties.Name
    $matched = $PropertyNames | Where-Object { $actualProperties -contains $_ }

    if ($matched.Count -gt 0) {
        Write-Pass "$Label has expected field: $($matched -join ', ')."
    }
    else {
        Write-Fail "$Label does not contain any expected fields: $($PropertyNames -join ', ')."
    }
}

function Invoke-BackendGet {
    param([string]$Url)

    Write-Host "GET $Url" -ForegroundColor DarkGray
    return Invoke-RestMethod -Method GET -Uri $Url
}

Write-Host "PixelForge Backend Public Runtime Smoke Test" -ForegroundColor Yellow
Write-Host "API Base : $ApiBase"
Write-Host "Feature  : $Feature"

Write-Section "Test 1: GET /limits"

try {
    $limits = Invoke-BackendGet "$ApiBase/limits"

    Assert-Property -Object $limits -PropertyName "upload" -Label "/limits response"
    Assert-Property -Object $limits -PropertyName "result" -Label "/limits response"
    Assert-Property -Object $limits -PropertyName "upscale" -Label "/limits response"
    Assert-Property -Object $limits -PropertyName "features" -Label "/limits response"

    if ($null -ne $limits.upload) {
        Assert-Property -Object $limits.upload -PropertyName "max_file_size_mb" -Label "/limits.upload"
        Assert-Property -Object $limits.upload -PropertyName "max_file_size_bytes" -Label "/limits.upload"
        Assert-Property -Object $limits.upload -PropertyName "max_megapixels" -Label "/limits.upload"
        Assert-Property -Object $limits.upload -PropertyName "max_pixels" -Label "/limits.upload"
        Assert-Property -Object $limits.upload -PropertyName "allowed_extensions" -Label "/limits.upload"

        if ($null -ne $limits.upload.allowed_extensions -and $limits.upload.allowed_extensions.Count -gt 0) {
            Write-Pass "/limits.upload.allowed_extensions is not empty."
        }
        else {
            Write-Fail "/limits.upload.allowed_extensions is empty."
        }
    }

    if ($null -ne $limits.result) {
        Assert-Property -Object $limits.result -PropertyName "max_result_file_size_mb" -Label "/limits.result"
        Assert-Property -Object $limits.result -PropertyName "max_result_file_size_bytes" -Label "/limits.result"
    }

    if ($null -ne $limits.upscale) {
        Assert-Property -Object $limits.upscale -PropertyName "default_scale" -Label "/limits.upscale"
        Assert-Property -Object $limits.upscale -PropertyName "max_output_pixels" -Label "/limits.upscale"
    }

    Write-Host ""
    Write-Host "Limits response:" -ForegroundColor DarkGray
    $limits | ConvertTo-Json -Depth 8
}
catch {
    Write-Fail "GET /limits failed: $($_.Exception.Message)"
}

Write-Section "Test 2: GET /usage?feature=$Feature"

try {
    $usage = Invoke-BackendGet "$ApiBase/usage?feature=$Feature"

    Assert-AnyProperty `
        -Object $usage `
        -PropertyNames @(
            "remaining",
            "remaining_uses",
            "limit",
            "used",
            "usage_count",
            "reset_at",
            "reset_timestamp"
        ) `
        -Label "/usage response"

    Write-Host ""
    Write-Host "Usage response:" -ForegroundColor DarkGray
    $usage | ConvertTo-Json -Depth 8
}
catch {
    Write-Fail "GET /usage?feature=$Feature failed: $($_.Exception.Message)"
}

Write-Host ""

if ($script:Failed -gt 0) {
    Write-Host "Smoke test finished with $script:Failed failure(s)." -ForegroundColor Red
    exit 1
}

Write-Host "All public runtime smoke tests passed." -ForegroundColor Green
exit 0