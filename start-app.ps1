# Smart Ease Studio - Native Standalone Desktop Launcher
# 100% Offline - Zero Web Server - Zero 127.0.0.1 Connection Errors

$appDir = $PSScriptRoot
$exePath = Join-Path $appDir "SmartEasePhotobookStudio.exe"
if (!(Test-Path $exePath)) {
    $exePath = Join-Path $appDir "SmartEaseStudio.exe"
}

if (Test-Path $exePath) {
    Start-Process -FilePath $exePath
    exit
}

# Fallback direct file launcher
$htmlPath = Join-Path $appDir "index.html"
$fileUri = "file:///" + $htmlPath.Replace('\', '/')

$edgePaths = @(
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Google\Chrome\Application\chrome.exe"
)

$targetExe = $null
foreach ($p in $edgePaths) {
    if (Test-Path $p) {
        $targetExe = $p
        break
    }
}

$userData = Join-Path $env:LOCALAPPDATA "SmartEaseStudio\Profile"
if (!(Test-Path $userData)) {
    New-Item -ItemType Directory -Path $userData -Force | Out-Null
}

if ($targetExe) {
    Start-Process -FilePath $targetExe -ArgumentList "--app=`"$fileUri`"", "--window-size=1440,920", "--allow-file-access-from-files", "--user-data-dir=`"$userData`"", "--no-first-run", "--no-default-browser-check"
} else {
    Start-Process $fileUri
}
