$ErrorActionPreference = "Stop"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Pass {
    param([string]$Message)
    Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Find-RepoRoot {
    $Current = Get-Location

    while ($null -ne $Current) {
        $HasBackend = Test-Path (Join-Path $Current.Path "backend")
        $HasFrontend = Test-Path (Join-Path $Current.Path "frontend")

        if ($HasBackend -and $HasFrontend) {
            return $Current.Path
        }

        $Current = $Current.Parent
    }

    return (Get-Location).Path
}

function Get-LineCount {
    param([string]$Path)

    $Count = 0

    foreach ($Line in [System.IO.File]::ReadLines($Path)) {
        $Count++
    }

    return $Count
}

function Normalize-Extensions {
    param([string]$ExtensionInput)

    if ([string]::IsNullOrWhiteSpace($ExtensionInput)) {
        return @()
    }

    return @(
        $ExtensionInput -split "," |
            ForEach-Object {
                $Ext = $_.Trim().ToLower()

                if ([string]::IsNullOrWhiteSpace($Ext)) {
                    return
                }

                if (-not $Ext.StartsWith(".")) {
                    $Ext = ".$Ext"
                }

                $Ext
            } |
            Where-Object {
                -not [string]::IsNullOrWhiteSpace($_)
            }
    )
}

function Get-LanguageLabel {
    param([string]$Extension)

    switch ($Extension.ToLower()) {
        ".py" { return "Python Files" }
        ".js" { return "JavaScript Files" }
        ".jsx" { return "React JSX Files" }
        ".ts" { return "TypeScript Files" }
        ".tsx" { return "React TSX Files" }
        ".ps1" { return "PowerShell Scripts" }
        ".bat" { return "Batch Files" }
        ".md" { return "Markdown Docs" }
        ".json" { return "JSON Files" }
        ".css" { return "CSS Files" }
        ".html" { return "HTML Files" }
        default { return "$Extension Files" }
    }
}

function Get-TopGroup {
    param(
        [string]$RelativePath,
        [string]$Extension
    )

    $CleanPath = $RelativePath.TrimStart("\", "/")
    $Parts = $CleanPath -split "[\\/]"
    $Top = $Parts[0]

    if ([string]::IsNullOrWhiteSpace($Top)) {
        return "Root"
    }

    switch ($Top.ToLower()) {
        "backend" { return "Backend" }
        "frontend" { return "Frontend" }
        "scripts" { return "Scripts" }
        "docs" { return "Docs" }
        default { return "Root / Other" }
    }
}

function Get-DisplayPath {
    param([string]$RelativePath)

    $CleanPath = $RelativePath.TrimStart("\", "/")
    $Parts = $CleanPath -split "[\\/]"

    if ($Parts.Count -le 1) {
        return $CleanPath
    }

    $Top = $Parts[0].ToLower()

    if ($Top -in @("backend", "frontend", "scripts", "docs")) {
        return ($Parts[1..($Parts.Count - 1)] -join "\")
    }

    return $CleanPath
}

function Resolve-TargetFiles {
    param(
        [string]$RepoRoot,
        [string]$Target,
        [string[]]$Extensions
    )

    $ExcludePattern = "\\(node_modules|\.git|venv|\.venv|dist|build|__pycache__|\.pytest_cache|\.ruff_cache|coverage)(\\|$)"

    if ([string]::IsNullOrWhiteSpace($Target)) {
        $Target = "."
    }

    $TargetPath = if ([System.IO.Path]::IsPathRooted($Target)) {
        $Target
    }
    else {
        Join-Path $RepoRoot $Target
    }

    if (Test-Path $TargetPath -PathType Leaf) {
        $Files = @(Get-Item $TargetPath)
    }
    elseif (Test-Path $TargetPath -PathType Container) {
        $Files = @(Get-ChildItem $TargetPath -Recurse -File)
    }
    else {
        $Files = @(Get-ChildItem -Path $TargetPath -Recurse -File -ErrorAction SilentlyContinue)
    }

    $Files = $Files | Where-Object {
        $_.FullName -notmatch $ExcludePattern
    }

    if ($Extensions.Count -gt 0) {
        $Files = $Files | Where-Object {
            $_.Extension.ToLower() -in $Extensions
        }
    }

    return @($Files)
}

Clear-Host

$RepoRoot = Find-RepoRoot

Write-Host "PixelForge total line checker" -ForegroundColor Magenta
Write-Host ""
Write-Info "Repo root: $RepoRoot"
Write-Host ""

$Target = Read-Host "Enter file/folder/glob to check. Example: backend, frontend/src, scripts, or . "
$ExtensionInput = Read-Host "Filter extensions? Example: py,js,jsx,ps1,md. Leave empty for all files"

$Extensions = Normalize-Extensions -ExtensionInput $ExtensionInput
$Files = Resolve-TargetFiles -RepoRoot $RepoRoot -Target $Target -Extensions $Extensions

if ($Files.Count -eq 0) {
    Write-Warn "No matching files found."
    exit 0
}

$Results = @()
$TotalLines = 0

foreach ($File in $Files) {
    $LineCount = Get-LineCount -Path $File.FullName
    $TotalLines += $LineCount

    $RelativePath = $File.FullName.Substring($RepoRoot.Length)
    $Extension = $File.Extension.ToLower()

    $Results += [pscustomobject]@{
        Lines = $LineCount
        Group = Get-TopGroup -RelativePath $RelativePath -Extension $Extension
        Language = Get-LanguageLabel -Extension $Extension
        File = Get-DisplayPath -RelativePath $RelativePath
        Extension = $Extension
    }
}

$Results = $Results | Sort-Object Group, Language, @{ Expression = "Lines"; Descending = $true }

$Summary = $Results |
    Group-Object Language |
    ForEach-Object {
        [pscustomobject]@{
            Language = $_.Name
            Files = $_.Count
            Lines = ($_.Group | Measure-Object Lines -Sum).Sum
        }
    } |
    Sort-Object Lines -Descending

$OutputLines = @()

$OutputLines += "PixelForge total line report"
$OutputLines += "Repo root : $RepoRoot"
$OutputLines += "Target    : $Target"
$OutputLines += "Filters   : $(if ($Extensions.Count -gt 0) { $Extensions -join ', ' } else { 'all files' })"
$OutputLines += ""
$OutputLines += "Summary"
$OutputLines += "-------"

Write-Host ""
Write-Host "Summary" -ForegroundColor Magenta
Write-Host "-------"

foreach ($Item in $Summary) {
    $SummaryLine = "{0}: {1} files, {2} lines" -f $Item.Language, $Item.Files, $Item.Lines
    Write-Host $SummaryLine
    $OutputLines += $SummaryLine
}

$OutputLines += ""
$OutputLines += "Total files: $($Results.Count)"
$OutputLines += "Total lines: $TotalLines"

Write-Host ""
Write-Info "Total files: $($Results.Count)"
Write-Info "Total lines: $TotalLines"

$OutputLines += ""
$OutputLines += "Details"
$OutputLines += "-------"

$GroupedByTop = $Results | Group-Object Group

foreach ($TopGroup in $GroupedByTop) {
    Write-Host ""
    Write-Host "=== $($TopGroup.Name) ===" -ForegroundColor Yellow

    $OutputLines += ""
    $OutputLines += "=== $($TopGroup.Name) ==="

    $GroupedByLanguage = $TopGroup.Group | Group-Object Language

    foreach ($LanguageGroup in $GroupedByLanguage) {
        $LanguageLines = ($LanguageGroup.Group | Measure-Object Lines -Sum).Sum
        $Header = "{0}: {1} files, {2} lines" -f $LanguageGroup.Name, $LanguageGroup.Count, $LanguageLines

        Write-Host ""
        Write-Host $Header -ForegroundColor Cyan

        $OutputLines += ""
        $OutputLines += $Header
        $OutputLines += ("-" * $Header.Length)
        $OutputLines += ("{0,6}  {1}" -f "Lines", "File")
        $OutputLines += ("{0,6}  {1}" -f "-----", "----")

        $TableRows = $LanguageGroup.Group | Sort-Object Lines -Descending

        foreach ($Row in $TableRows) {
            $Line = "{0,6}  {1}" -f $Row.Lines, $Row.File
            Write-Host $Line
            $OutputLines += $Line
        }
    }
}

$OutputText = $OutputLines -join [Environment]::NewLine

Write-Host ""
$CopyAnswer = Read-Host "Copy result to clipboard? Y/N"

if ($CopyAnswer -match "^[Yy]$") {
    $OutputText | Set-Clipboard
    Write-Pass "Copied formatted line-count report to clipboard."
}
else {
    Write-Info "Skipped clipboard copy."
}