<#
.SYNOPSIS
    Tests PixelForge's full invalid-image background failure path.

.DESCRIPTION
    This script verifies that the backend correctly handles an uploaded file
    that passes the upload step but is not a valid image.

    The test flow is:
      1. Initialize an AI job using the local Turnstile bypass token.
      2. Create a fake image file.
      3. Upload the fake file to Azure Blob Storage using the SAS upload URL.
      4. Start the AI job.
      5. Poll the result endpoint until the job fails.
      6. Assert that the failure uses the structured INVALID_IMAGE payload.

.PARAMETER ApiBase
    Base API URL for the backend.

.PARAMETER Feature
    AI feature route to test. Defaults to upscale.

.PARAMETER PollIntervalSeconds
    Seconds to wait between result polling attempts.

.PARAMETER MaxPollAttempts
    Maximum number of polling attempts before failing the test.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_invalid_image_upload.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_invalid_image_upload.ps1 `
      -ApiBase "http://127.0.0.1:8000/api" `
      -Feature "upscale" `
      -PollIntervalSeconds 2 `
      -MaxPollAttempts 20
#>

param(
    [string]$ApiBase = "http://127.0.0.1:8000/api",
    [string]$Feature = "upscale",
    [int]$PollIntervalSeconds = 2,
    [int]$MaxPollAttempts = 20
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

function Test-Property {
    param(
        [object]$Object,
        [string]$Name
    )

    return $null -ne $Object -and $Object.PSObject.Properties.Name -contains $Name
}

function Invoke-JsonPost {
    param(
        [string]$Url,
        [string]$JsonFilePath
    )

    return Invoke-RestMethod `
        -Uri $Url `
        -Method Post `
        -ContentType "application/json" `
        -InFile $JsonFilePath
}

$RunId = [guid]::NewGuid().ToString("N")
$TempDir = Join-Path $env:TEMP "pixelforge-invalid-image-$RunId"
$InitJsonPath = Join-Path $TempDir "init-request.json"
$StartJsonPath = Join-Path $TempDir "start-request.json"
$FakeImagePath = Join-Path $TempDir "fake-image.png"

try {
    New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

    Write-Host ""
    Write-Host "PixelForge invalid image upload test"
    Write-Host "API base: $ApiBase"
    Write-Host "Feature : $Feature"
    Write-Host ""

    @{
        filename = "fake-image.png"
        cf_turnstile_response = "manual_test_bypass"
    } | ConvertTo-Json -Compress | Set-Content -NoNewline -Encoding UTF8 $InitJsonPath

    $InitUrl = "$ApiBase/$Feature/init"

    Write-Host "Initializing job..."
    $InitResponse = Invoke-JsonPost -Url $InitUrl -JsonFilePath $InitJsonPath

    if (-not (Test-Property $InitResponse "job_id")) {
        Write-Fail "Init response did not contain job_id."
        exit 1
    }

    if (-not (Test-Property $InitResponse "upload_url")) {
        Write-Fail "Init response did not contain upload_url."
        exit 1
    }

    if (-not (Test-Property $InitResponse "safe_filename")) {
        Write-Fail "Init response did not contain safe_filename."
        exit 1
    }

    $JobId = $InitResponse.job_id
    $UploadUrl = $InitResponse.upload_url
    $SafeFilename = $InitResponse.safe_filename

    Write-Pass "Initialized job '$JobId'."

    "not a real image" | Set-Content -NoNewline -Encoding UTF8 $FakeImagePath
    Write-Pass "Created fake image file."

    Write-Host "Uploading fake image to Azure Blob Storage..."

    $CurlOutput = curl.exe -sS -X PUT `
        -H "x-ms-blob-type: BlockBlob" `
        -H "Content-Type: image/png" `
        --data-binary "@$FakeImagePath" `
        "$UploadUrl" 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Azure upload failed."
        Write-Host $CurlOutput
        exit 1
    }

    Write-Pass "Uploaded fake image to Azure."

    $StartPayload = @{
        job_id = $JobId
        safe_filename = $SafeFilename
    }

    if ($Feature -eq "upscale") {
        $StartPayload.scale = 2
    }

    $StartPayload | ConvertTo-Json -Compress | Set-Content -NoNewline -Encoding UTF8 $StartJsonPath

    $StartUrl = "$ApiBase/$Feature/start"

    Write-Host "Starting job..."
    $null = Invoke-JsonPost -Url $StartUrl -JsonFilePath $StartJsonPath
    Write-Pass "Started background job."

    $ResultUrl = "$ApiBase/result/$JobId"
    $FinalResult = $null

    Write-Host "Polling result..."

    for ($Attempt = 1; $Attempt -le $MaxPollAttempts; $Attempt++) {
        $Result = Invoke-RestMethod -Uri $ResultUrl -Method Get

        $Status = $Result.status
        Write-Host "Attempt $Attempt/$MaxPollAttempts -> status=$Status"

        if ($Status -eq "failed") {
            $FinalResult = $Result
            break
        }

        if ($Status -eq "ready") {
            Write-Fail "Job unexpectedly succeeded even though the uploaded file was invalid."
            exit 1
        }

        Start-Sleep -Seconds $PollIntervalSeconds
    }

    if ($null -eq $FinalResult) {
        Write-Fail "Job did not reach failed status after $MaxPollAttempts attempts."
        exit 1
    }

    if ($FinalResult.status -ne "failed") {
        Write-Fail "Expected status 'failed', got '$($FinalResult.status)'."
        exit 1
    }

    Write-Pass "Job returned failed status."

    if ($FinalResult.code -ne "INVALID_IMAGE") {
        Write-Fail "Expected code 'INVALID_IMAGE', got '$($FinalResult.code)'."
        exit 1
    }

    Write-Pass "Job returned code 'INVALID_IMAGE'."

    if ($FinalResult.message -ne "Invalid image data.") {
        Write-Fail "Expected message 'Invalid image data.', got '$($FinalResult.message)'."
        exit 1
    }

    Write-Pass "Job returned expected message."

    Write-Host ""
    Write-Pass "Invalid image upload background failure test passed."
    exit 0
}
catch {
    Write-Fail $_.Exception.Message

    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }

    exit 1
}
finally {
    if (Test-Path $TempDir) {
        Remove-Item $TempDir -Recurse -Force
    }
}