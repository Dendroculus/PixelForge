<#
.SYNOPSIS
    Check PixelForge backend structured error responses.

.DESCRIPTION
    This script verifies request-time backend error handling for common invalid
    API requests:

        - Invalid job ID
        - Invalid JSON request body
        - Invalid Cloudflare Turnstile token

    These tests confirm that FastAPI exception handlers and structured error
    utilities return stable frontend-friendly error payloads.

.PARAMETER ApiBase
    Base API URL. Defaults to local FastAPI development server.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/testing/check_backend_error_responses.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/testing/check_backend_error_responses.ps1 `
        -ApiBase "http://127.0.0.1:8000/api"
#>

param(
    [string]$ApiBase = "http://127.0.0.1:8000/api"
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

function Invoke-CurlJson {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    $raw = & curl.exe @Arguments

    if ([string]::IsNullOrWhiteSpace($raw)) {
        throw "Empty response from curl.exe"
    }

    try {
        return $raw | ConvertFrom-Json
    }
    catch {
        Write-Host "Raw response:" -ForegroundColor DarkGray
        Write-Host $raw
        throw
    }
}

function Assert-ErrorResponse {
    param(
        [Parameter(Mandatory = $true)]
        [object]$Response,

        [Parameter(Mandatory = $true)]
        [string]$ExpectedCode,

        [Parameter(Mandatory = $true)]
        [string]$Label,

        [string]$ExpectedMessage = ""
    )

    if ($null -eq $Response) {
        Write-Fail "$Label returned null response."
        return
    }

    if ($Response.PSObject.Properties.Name -notcontains "code") {
        Write-Fail "$Label response is missing 'code'."
        return
    }

    if ($Response.PSObject.Properties.Name -notcontains "message") {
        Write-Fail "$Label response is missing 'message'."
        return
    }

    if ($Response.code -eq $ExpectedCode) {
        Write-Pass "$Label returned code '$ExpectedCode'."
    }
    else {
        Write-Fail "$Label expected code '$ExpectedCode' but got '$($Response.code)'."
    }

    if (-not [string]::IsNullOrWhiteSpace($ExpectedMessage)) {
        if ($Response.message -eq $ExpectedMessage) {
            Write-Pass "$Label returned expected message."
        }
        else {
            Write-Fail "$Label expected message '$ExpectedMessage' but got '$($Response.message)'."
        }
    }
    else {
        if (-not [string]::IsNullOrWhiteSpace($Response.message)) {
            Write-Pass "$Label returned a non-empty message."
        }
        else {
            Write-Fail "$Label returned an empty message."
        }
    }

    Write-Host ""
    Write-Host "$Label response:" -ForegroundColor DarkGray
    $Response | ConvertTo-Json -Depth 8
}

Write-Host "PixelForge Backend Error Response Check" -ForegroundColor Yellow
Write-Host "API Base : $ApiBase"

Write-Section "Test 1: Invalid job ID"

try {
    $response = Invoke-CurlJson -Arguments @(
        "-s",
        "$ApiBase/result/bad-id"
    )

    Assert-ErrorResponse `
        -Response $response `
        -ExpectedCode "VALIDATION_ERROR" `
        -ExpectedMessage "Invalid job ID" `
        -Label "Invalid job ID"
}
catch {
    Write-Fail "Invalid job ID test failed: $($_.Exception.Message)"
}

Write-Section "Test 2: Invalid request body"

try {
    $response = Invoke-CurlJson -Arguments @(
        "-s",
        "-X", "POST",
        "$ApiBase/upscale/init",
        "-H", "Content-Type: application/json",
        "--data-binary", "{}"
    )

    Assert-ErrorResponse `
        -Response $response `
        -ExpectedCode "VALIDATION_ERROR" `
        -ExpectedMessage "Request validation failed." `
        -Label "Invalid request body"
}
catch {
    Write-Fail "Invalid request body test failed: $($_.Exception.Message)"
}

Write-Section "Test 3: Invalid Turnstile token"

try {
    $badTokenJson = Join-Path $env:TEMP "pixelforge-bad-turnstile.json"

    @{
        filename = "test.png"
        cf_turnstile_response = "wrong-token"
    } | ConvertTo-Json -Compress | Set-Content -NoNewline -Encoding UTF8 $badTokenJson

    $response = Invoke-CurlJson -Arguments @(
        "-s",
        "-X", "POST",
        "$ApiBase/upscale/init",
        "-H", "Content-Type: application/json",
        "--data-binary", "@$badTokenJson"
    )

    Assert-ErrorResponse `
        -Response $response `
        -ExpectedCode "AUTH_FAILED" `
        -ExpectedMessage "Bot protection verification failed." `
        -Label "Invalid Turnstile token"
}
catch {
    Write-Fail "Invalid Turnstile token test failed: $($_.Exception.Message)"
}

Write-Host ""

if ($script:Failed -gt 0) {
    Write-Host "Error response check finished with $script:Failed failure(s)." -ForegroundColor Red
    exit 1
}

Write-Host "All backend error response checks passed." -ForegroundColor Green
exit 0