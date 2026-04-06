# High-Performance Project Progeny Packaging
# This script uses native Windows tar for rapid zip generation.

$projName = "Project_Progeny_Source"
$dateStr = Get-Date -Format "yyyyMMdd-HHmm"
$zipOut = "$projName-$dateStr.zip"

Write-Host "--- Progeny Source Packaging ---"

# Use simpler directory-specific tar command to avoid filter complexity
# We run tar with --exclude flags on a single line to ensure parser stability.
tar.exe -a -c -f $zipOut --exclude="node_modules" --exclude="venv" --exclude=".next" --exclude=".expo" --exclude=".git" --exclude="build" --exclude="dist" --exclude="*.zip" .

Write-Host "Status: Complete"
Write-Host "File created: $zipOut"
