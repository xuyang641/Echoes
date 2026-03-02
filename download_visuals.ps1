# Echoes Visual Upgrade Script
# Downloads high-quality visual assets for App Icon and Splash Screen.

$ErrorActionPreference = "Stop"

$assetsDir = "assets"
$iconPath = "$assetsDir/icon.png"
$splashPath = "$assetsDir/splash.png" # Changed to .png for consistency

# Create directory if needed
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

Write-Host "🎨 Starting Visual Upgrade..."

# 1. Download App Icon (Minimalist Notebook/Journal style)
# Source: Flaticon (Direct PNG link) or similar icon repo
$iconUrl = "https://cdn-icons-png.flaticon.com/512/3209/3209265.png" # Minimalist diary icon
Write-Host "⬇️ Downloading App Icon..."
try {
    Invoke-WebRequest -Uri $iconUrl -OutFile $iconPath -UserAgent "Mozilla/5.0"
    Write-Host "✅ Icon saved to $iconPath"
} catch {
    Write-Error "❌ Failed to download icon: $_"
}

# 2. Download Splash Screen (Nature/Atmospheric background)
# Source: Unsplash (Direct source link with specific dimensions)
$splashUrl = "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80" # Misty mountains
Write-Host "⬇️ Downloading Splash Screen..."
try {
    Invoke-WebRequest -Uri $splashUrl -OutFile $splashPath -UserAgent "Mozilla/5.0"
    Write-Host "✅ Splash screen saved to $splashPath"
} catch {
    Write-Error "❌ Failed to download splash screen: $_"
}

# 3. Verify files
if ((Test-Path $iconPath) -and (Test-Path $splashPath)) {
    Write-Host "🎉 Visual assets are ready for generation!"
    Write-Host "👉 Next step: Run 'npx capacitor-assets generate --android'"
} else {
    Write-Error "❌ One or more files failed to download."
}
