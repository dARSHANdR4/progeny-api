# Progeny Project Packaging Script
# This script bundles the entire Progeny Platform into a clean ZIP file for distribution.

$projectName = "Project_Progeny_Full_Source"
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$zipFileName = "$projectName-$timestamp.zip"
$rootPath = "x:\progeny-main\progeny-main"

Write-Host "📦 Starting Progeny project packaging..." -ForegroundColor Cyan

# Define exclusions
$excludeDirs = @(
    "node_modules",
    "venv",
    ".next",
    ".expo",
    ".git",
    "build",
    "dist",
    "out",
    "__pycache__",
    ".turbo",
    "Progeny_Stage"
)

# Create a temporary directory for staging
$stagingPath = Join-Path $env:TEMP "Progeny_Stage_$timestamp"
if (Test-Path $stagingPath) { Remove-Item -Path $stagingPath -Recurse -Force }
New-Item -ItemType Directory -Path $stagingPath -Force | Out-Null

Write-Host "📂 Copying files to staging (excluding heavy/temp folders)..." -ForegroundColor Yellow

# Copy everything except excluded directories
Get-ChildItem -Path $rootPath -Recurse | Where-Object {
    $relativePath = $_.FullName.Substring($rootPath.Length).TrimStart("\")
    $shouldExclude = $false
    foreach ($exclude in $excludeDirs) {
        if ($relativePath -eq $exclude -or $relativePath.StartsWith("$exclude\")) {
            $shouldExclude = $true
            break
        }
    }
    # Also exclude existing zip files in the root
    if ($_.Name -like "*.zip" -and $_.Parent.FullName -eq $rootPath) {
        $shouldExclude = $true
    }
    return -not $shouldExclude
} | ForEach-Object {
    $dest = Join-Path $stagingPath ($_.FullName.Substring($rootPath.Length).TrimStart("\"))
    if ($_.PSIsContainer) {
        if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest -Force | Out-Null }
    } else {
        $parent = Split-Path $dest -Parent
        if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
        Copy-Item -Path $_.FullName -Destination $dest -Force
    }
}

Write-Host "🗜️ Creating ZIP archive..." -ForegroundColor Yellow
Compress-Archive -Path "$stagingPath\*" -DestinationPath "$rootPath\$zipFileName" -Force

Write-Host "✅ Packaging Complete!" -ForegroundColor Green
Write-Host "📄 File: $zipFileName"
Write-Host "📍 Location: $rootPath"

# Cleanup
Remove-Item -Path $stagingPath -Recurse -Force
