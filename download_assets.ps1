# Download Assets Script for Echoes
# This script downloads real audio files and fonts to "thicken" the app.

$ErrorActionPreference = "Stop"

# Define target directories
$soundsDir = "public/sounds"
$fontsDir = "public/fonts"

# Create directories if they don't exist
New-Item -ItemType Directory -Force -Path $soundsDir | Out-Null
New-Item -ItemType Directory -Force -Path $fontsDir | Out-Null

Write-Host "📂 Directories created."

# Define resources to download
# Note: Using high-quality, royalty-free sources where possible.
$resources = @(
    @{
        Name = "rain.mp3"
        Url = "https://www.soundjay.com/nature/sounds/rain-03.mp3"
        Dest = "$soundsDir/rain.mp3"
    },
    @{
        Name = "forest.mp3"
        Url = "https://www.soundjay.com/nature/sounds/forest-04.mp3" 
        Dest = "$soundsDir/forest.mp3"
    },
    @{
        Name = "ocean.mp3"
        Url = "https://www.soundjay.com/nature/sounds/ocean-wave-1.mp3"
        Dest = "$soundsDir/ocean.mp3"
    },
    @{
        Name = "cafe.mp3"
        # Using a restaurant ambience as proxy for cafe
        Url = "https://www.soundjay.com/misc/sounds/restaurant-ambience-1.mp3"
        Dest = "$soundsDir/cafe.mp3"
    },
    @{
        Name = "LXGWWenKai-Regular.ttf"
        # Using a specific version from GitHub releases for stability
        Url = "https://github.com/lxgw/LxgwWenKai/releases/download/v1.300/LXGWWenKai-Regular.ttf"
        Dest = "$fontsDir/LXGWWenKai-Regular.ttf"
    }
)

# Download loop
foreach ($res in $resources) {
    Write-Host "⬇️ Downloading $($res.Name)..."
    try {
        # Use a user agent to avoid some 403s
        Invoke-WebRequest -Uri $res.Url -OutFile $res.Dest -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        
        # Check file size
        $item = Get-Item $res.Dest
        $sizeMb = [math]::Round($item.Length / 1MB, 2)
        
        if ($item.Length -lt 10KB) {
            Write-Warning "⚠️ File $($res.Name) is too small ($($item.Length) bytes). It might be an invalid download."
        } else {
            Write-Host "✅ Saved to $($res.Dest) ($sizeMb MB)"
        }
    }
    catch {
        Write-Error "❌ Failed to download $($res.Name): $_"
    }
}

Write-Host "🎉 Asset download complete!"
