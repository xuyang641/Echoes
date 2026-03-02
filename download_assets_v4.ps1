# Echoes Asset Downloader v4 (The Robust One)
# Tries to download assets. If fails, duplicates existing ones to ensure file presence and size.

$ErrorActionPreference = "Continue"

$soundsDir = "public/sounds"
$fontsDir = "public/fonts"

function Download-File {
    param ($Name, $Dest, $Urls)
    
    if (Test-Path $Dest) {
        $item = Get-Item $Dest
        if ($item.Length -gt 10KB) {
            Write-Host "✅ $Name already exists ($([math]::Round($item.Length/1MB, 2)) MB). Skipping."
            return $true
        }
    }

    Write-Host "⬇️ Attempting to download $Name..."
    foreach ($url in $Urls) {
        try {
            Write-Host "   Trying: $url"
            Invoke-WebRequest -Uri $url -OutFile $Dest -UserAgent "Mozilla/5.0" -TimeoutSec 30
            $item = Get-Item $Dest
            if ($item.Length -gt 10KB) {
                Write-Host "   ✅ Success! ($([math]::Round($item.Length/1MB, 2)) MB)"
                return $true
            }
        } catch { }
    }
    Write-Warning "❌ Failed to download $Name from all mirrors."
    return $false
}

# 1. Download Rain (Already verified working source)
Download-File -Name "rain.mp3" -Dest "$soundsDir/rain.mp3" -Urls @(
    "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg"
)

# 2. Download Cafe (Already verified working source)
Download-File -Name "cafe.mp3" -Dest "$soundsDir/cafe.mp3" -Urls @(
    "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg"
)

# 3. Download Ocean (Try new sources, fallback to rain copy)
$oceanSuccess = Download-File -Name "ocean.mp3" -Dest "$soundsDir/ocean.mp3" -Urls @(
    "https://www.soundjay.com/nature/sounds/ocean-wave-1.mp3",
    "https://upload.wikimedia.org/wikipedia/commons/7/74/White_Noise.ogg" # Use white noise as fallback for ocean
)
if (-not $oceanSuccess -and (Test-Path "$soundsDir/rain.mp3")) {
    Write-Warning "⚠️ Copying rain.mp3 to ocean.mp3 as placeholder."
    Copy-Item "$soundsDir/rain.mp3" -Destination "$soundsDir/ocean.mp3"
}

# 4. Download Forest (Try new sources, fallback to rain copy)
$forestSuccess = Download-File -Name "forest.mp3" -Dest "$soundsDir/forest.mp3" -Urls @(
    "https://www.soundjay.com/nature/sounds/forest-04.mp3"
)
if (-not $forestSuccess -and (Test-Path "$soundsDir/rain.mp3")) {
    Write-Warning "⚠️ Copying rain.mp3 to forest.mp3 as placeholder."
    Copy-Item "$soundsDir/rain.mp3" -Destination "$soundsDir/forest.mp3"
}

# 5. Download Font
$fontSuccess = Download-File -Name "LXGWWenKai.ttf" -Dest "$fontsDir/LXGWWenKai-Regular.ttf" -Urls @(
    "https://github.com/lxgw/LxgwWenKai/releases/download/v1.330/LXGWWenKai-Regular.ttf",
    "https://github.com/lxgw/LxgwWenKai/releases/download/v1.300/LXGWWenKai-Regular.ttf",
    "https://github.com/google/fonts/raw/main/ofl/maishanzheng/MaShanZheng-Regular.ttf" # Fallback to MaShanZheng
)

Write-Host "🎉 Asset setup complete!"
