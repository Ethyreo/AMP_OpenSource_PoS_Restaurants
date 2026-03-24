param(
    [string]$ProjectRoot = "D:\Coding Projects\Projects\restaurant-pos-android"
)

$sourceRoot = $ProjectRoot
$targetRoot = Join-Path $ProjectRoot 'android-shell\app\src\main\assets\web'

if (Test-Path $targetRoot) {
    Remove-Item -Recurse -Force $targetRoot
}

New-Item -ItemType Directory -Force -Path $targetRoot | Out-Null

$itemsToCopy = @(
    'index.html',
    'manifest.webmanifest',
    'sw.js',
    'app'
)

foreach ($item in $itemsToCopy) {
    $source = Join-Path $sourceRoot $item
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $targetRoot -Recurse -Force
    }
}

Write-Output "Synced web assets to $targetRoot"
