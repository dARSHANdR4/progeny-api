# Project Progeny: Optimized Packaging Script
# This script bundles the platform while excluding large node_modules/venv folders.

$projectName = "Project_Progeny_Source"
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$zipPath = ".\$projectName-$timestamp.zip"

Write-Host "Starting Progeny Source Package Generation..."

# Define items to EXCLUDE
$excludeList = @(
    "node_modules",
    "venv",
    ".next",
    ".expo",
    ".git",
    "__pycache__",
    "build",
    "dist"
)

Write-Host "Filtering files (Excluding heavy/temp files)..."

# Get all files except excluded ones
# We'll use a simpler filter to avoid memory issues with large objects
$files = Get-ChildItem -Path "." -Recurse | Where-Object {
    $itemPath = $_.FullName
    $shouldExclude = $false
    foreach ($exclude in $excludeList) {
        if ($itemPath -like "*\$exclude*" -or $itemPath -like "*\$exclude") {
            $shouldExclude = $true
            break
        }
    }
    # Also exclude existing zip files in the root
    if ($_.Name -like "*.zip") {
        $shouldExclude = $true
    }
    return -not $shouldExclude
}

Write-Host "Creating ZIP archive: $zipPath"

# Simple loop to ensure directory structure is respected without complex piping
$files | Compress-Archive -DestinationPath $zipPath -Force

Write-Host "Zip Created Successfully!"
Write-Host "File: $zipPath"
Write-Host "Location: done"
