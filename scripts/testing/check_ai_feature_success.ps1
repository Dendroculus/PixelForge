<#
.SYNOPSIS
    Tests a successful PixelForge AI feature workflow.

.DESCRIPTION
    This script verifies the full happy-path workflow for a PixelForge AI tool:

      1. Initialize an AI job with the local Turnstile bypass token.
      2. Upload the source image to Azure Blob Storage using the SAS upload URL.
      3. Optionally upload a mask image for object removal.
      4. Start the selected AI feature job.
      5. Poll the result endpoint until the job becomes ready.
      6. Assert that the result response contains a downloadable result URL.

    Supported features:
      - upscale
      - rembg
      - colorrestore
      - objectremove

.PARAMETER ApiBase
    Base API URL for the backend.

.PARAMETER Feature
    AI feature to test.

.PARAMETER FilePath
    Source image path. If omitted, a default demo image is selected for
    upscale, rembg, or colorrestore.

.PARAMETER Scale
    Upscale multiplier used only when Feature is "upscale".

.PARAMETER MaskPath
    Mask image path used only when Feature is "objectremove".

.PARAMETER PollIntervalSeconds
    Seconds to wait between result polling attempts.

.PARAMETER MaxPollAttempts
    Maximum number of polling attempts before failing the test.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_ai_feature_success.ps1 `
      -Feature upscale `
      -FilePath ".\frontend\public\demo\upscale_before.jpg" `
      -Scale 2

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_ai_feature_success.ps1 `
      -Feature rembg `
      -FilePath ".\frontend\public\demo\rem_bg_before.jpg"

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_ai_feature_success.ps1 `
      -Feature colorrestore `
      -FilePath ".\frontend\public\demo\res_color_before.jpg"

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_ai_feature_success.ps1 `
      -Feature objectremove `
      -FilePath ".\frontend\public\demo\object_remove_before.png" `
      -MaskPath ".\some-mask.png"
#>

param(
    [string]$ApiBase = "http://127.0.0.1:8000/api",

    [ValidateSet("upscale", "rembg", "colorrestore", "objectremove")]
    [string]$Feature = "upscale",

    [string]$FilePath = "",

    [ValidateRange(1, 4)]
    [int]$Scale = 2,

    [string]$MaskPath = "",

    [int]$PollIntervalSeconds = 3,

    [int]$MaxPollAttempts = 80
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
    exit 1
}

function Test-Property {
    param(
        [object]$Object,
        [string]$Name
    )

    return $null -ne $Object -and $Object.PSObject.Properties.Name -contains $Name
}

function Get-DefaultFilePath {
    param([string]$SelectedFeature)

    switch ($SelectedFeature) {
        "upscale" {
            return ".\frontend\public\demo\upscale_before.jpg"
        }
        "rembg" {
            return ".\frontend\public\demo\rem_bg_before.jpg"
        }
        "colorrestore" {
            return ".\frontend\public\demo\res_color_before.jpg"
        }
        "objectremove" {
            return ".\frontend\public\demo\object_remove_before.png"
        }
        default {
            return ""
        }
    }
}

function Get-ContentType {
    param([string]$Path)

    $Extension = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()

    switch ($Extension) {
        ".jpg" {
            return "image/jpeg"
        }
        ".jpeg" {
            return "image/jpeg"
        }
        ".png" {
            return "image/png"
        }
        ".webp" {
            return "image/webp"
        }
        default {
            return "application/octet-stream"
        }
    }
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

function UploadFileToAzure {
    param(
        [string]$UploadUrl,
        [string]$Path
    )

    $ContentType = Get-ContentType -Path $Path

    $CurlOutput = curl.exe -sS -X PUT `
        -H "x-ms-blob-type: BlockBlob" `
        -H "Content-Type: $ContentType" `
        --data-binary "@$Path" `
        "$UploadUrl" 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host $CurlOutput
        Stop-Test "Azure upload failed for '$Path'."
    }
}

$ApiBase = $ApiBase.TrimEnd("/")

if ([string]::IsNullOrWhiteSpace($FilePath)) {
    $FilePath = Get-DefaultFilePath -SelectedFeature $Feature
}

if ([string]::IsNullOrWhiteSpace($FilePath)) {
    Stop-Test "FilePath is required."
}

if (-not (Test-Path $FilePath)) {
    Stop-Test "Source image not found: $FilePath"
}

$ResolvedFilePath = (Resolve-Path $FilePath).Path

if ($Feature -eq "objectremove") {
    if ([string]::IsNullOrWhiteSpace($MaskPath)) {
        Stop-Test "MaskPath is required when Feature is objectremove."
    }

    if (-not (Test-Path $MaskPath)) {
        Stop-Test "Mask image not found: $MaskPath"
    }

    $ResolvedMaskPath = (Resolve-Path $MaskPath).Path
}

$RunId = [guid]::NewGuid().ToString("N")
$TempDir = Join-Path $env:TEMP "pixelforge-ai-success-$RunId"
$InitJsonPath = Join-Path $TempDir "init-request.json"
$StartJsonPath = Join-Path $TempDir "start-request.json"

try {
    New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

    Write-Host ""
    Write-Host "PixelForge AI feature success test"
    Write-Host "API base: $ApiBase"
    Write-Host "Feature : $Feature"
    Write-Host "File    : $ResolvedFilePath"

    if ($Feature -eq "upscale") {
        Write-Host "Scale   : $Scale"
    }

    if ($Feature -eq "objectremove") {
        Write-Host "Mask    : $ResolvedMaskPath"
    }

    Write-Host ""

    $OriginalFilename = Split-Path $ResolvedFilePath -Leaf

    @{
        filename = $OriginalFilename
        cf_turnstile_response = "manual_test_bypass"
    } | ConvertTo-Json -Compress | Set-Content -NoNewline -Encoding UTF8 $InitJsonPath

    $InitUrl = "$ApiBase/$Feature/init"

    Write-Host "Initializing job..."
    $InitResponse = Invoke-JsonPost -Url $InitUrl -JsonFilePath $InitJsonPath

    if (-not (Test-Property $InitResponse "job_id")) {
        Stop-Test "Init response did not contain job_id."
    }

    if (-not (Test-Property $InitResponse "safe_filename")) {
        Stop-Test "Init response did not contain safe_filename."
    }

    if (-not (Test-Property $InitResponse "upload_url")) {
        Stop-Test "Init response did not contain upload_url."
    }

    $JobId = $InitResponse.job_id
    $SafeFilename = $InitResponse.safe_filename
    $UploadUrl = $InitResponse.upload_url

    Write-Pass "Initialized job '$JobId'."

    Write-Host "Uploading source image to Azure Blob Storage..."
    UploadFileToAzure -UploadUrl $UploadUrl -Path $ResolvedFilePath
    Write-Pass "Uploaded source image."

    $StartPayload = @{
        job_id = $JobId
        safe_filename = $SafeFilename
    }

    if ($Feature -eq "upscale") {
        $StartPayload.scale = $Scale
    }

    if ($Feature -eq "objectremove") {
        if (-not (Test-Property $InitResponse "mask_filename")) {
            Stop-Test "Init response did not contain mask_filename for objectremove."
        }

        if (-not (Test-Property $InitResponse "mask_upload_url")) {
            Stop-Test "Init response did not contain mask_upload_url for objectremove."
        }

        Write-Host "Uploading mask image to Azure Blob Storage..."
        UploadFileToAzure -UploadUrl $InitResponse.mask_upload_url -Path $ResolvedMaskPath
        Write-Pass "Uploaded mask image."

        $StartPayload.mask_filename = $InitResponse.mask_filename
    }

    $StartPayload | ConvertTo-Json -Compress | Set-Content -NoNewline -Encoding UTF8 $StartJsonPath

    $StartUrl = "$ApiBase/$Feature/start"

    Write-Host "Starting job..."
    $StartResponse = Invoke-JsonPost -Url $StartUrl -JsonFilePath $StartJsonPath

    if (Test-Property $StartResponse "job_id") {
        Write-Pass "Started job '$($StartResponse.job_id)'."
    }
    else {
        Write-Pass "Started background job."
    }

    $ResultUrl = "$ApiBase/result/$JobId"
    $FinalResult = $null

    Write-Host "Polling result..."

    for ($Attempt = 1; $Attempt -le $MaxPollAttempts; $Attempt++) {
        $Result = Invoke-RestMethod -Uri $ResultUrl -Method Get
        $Status = $Result.status

        Write-Host "Attempt $Attempt/$MaxPollAttempts -> status=$Status"

        if ($Status -eq "ready") {
            $FinalResult = $Result
            break
        }

        if ($Status -eq "failed") {
            $Code = $Result.code
            $Message = $Result.message
            Stop-Test "Job failed. code='$Code' message='$Message'"
        }

        Start-Sleep -Seconds $PollIntervalSeconds
    }

    if ($null -eq $FinalResult) {
        Stop-Test "Job did not reach ready status after $MaxPollAttempts attempts."
    }

    if ($FinalResult.status -ne "ready") {
        Stop-Test "Expected status 'ready', got '$($FinalResult.status)'."
    }

    Write-Pass "Job returned ready status."

    if (-not (Test-Property $FinalResult "url")) {
        Stop-Test "Ready result did not contain url."
    }

    if ([string]::IsNullOrWhiteSpace($FinalResult.url)) {
        Stop-Test "Ready result url was empty."
    }

    Write-Pass "Ready result contained a downloadable URL."

    Write-Host ""
    Write-Pass "AI feature success test passed for '$Feature'."
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