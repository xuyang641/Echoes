# Echoes Asset Downloader v2
# Downloads real audio and font files. Tries multiple mirrors.

$ErrorActionPreference = "Continue"

$soundsDir = "public/sounds"
$fontsDir = "public/fonts"

# Create directories
New-Item -ItemType Directory -Force -Path $soundsDir | Out-Null
New-Item -ItemType Directory -Force -Path $fontsDir | Out-Null

function Download-File {
    param ($Name, $Dest, $Urls)
    
    Write-Host "⬇️ Attempting to download $Name..."
    
    foreach ($url in $Urls) {
        try {
            Write-Host "   Trying: $url"
            Invoke-WebRequest -Uri $url -OutFile $Dest -UserAgent "Mozilla/5.0" -TimeoutSec 15
            
            $item = Get-Item $Dest
            if ($item.Length -gt 50KB) {
                Write-Host "   ✅ Success! ($([math]::Round($item.Length/1MB, 2)) MB)"
                return
            } else {
                Write-Warning "   ⚠️ File too small, trying next mirror..."
            }
        } catch {
            Write-Warning "   ❌ Failed: $_"
        }
    }
    
    Write-Error "🔥 All mirrors failed for $Name"
}

# 1. Download Font (LXGW WenKai)
Download-File -Name "LXGWWenKai-Regular.ttf" -Dest "$fontsDir/LXGWWenKai-Regular.ttf" -Urls @(
    "https://github.com/lxgw/LxgwWenKai/releases/download/v1.300/LXGWWenKai-Regular.ttf",
    "https://github.com/lxgw/LxgwWenKai/releases/download/v1.240/LXGWWenKai-Regular.ttf"
)

# 2. Download Rain Sound
Download-File -Name "rain.mp3" -Dest "$soundsDir/rain.mp3" -Urls @(
    "https://www.pacdv.com/sounds/ambience_sounds/rain_sound_2.mp3",
    "https://www.soundjay.com/nature/sounds/rain-03.mp3",
    "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg" # OGG fallback
)

# 3. Download Ocean Sound
Download-File -Name "ocean.mp3" -Dest "$soundsDir/ocean.mp3" -Urls @(
    "https://www.pacdv.com/sounds/ambience_sounds/ocean_waves_2.mp3",
    "https://www.soundjay.com/nature/sounds/ocean-wave-1.mp3",
    "https://actions.google.com/sounds/v1/water/waves_crashing_on_rocks_beach.ogg"
)

# 4. Download Forest Sound
Download-File -Name "forest.mp3" -Dest "$soundsDir/forest.mp3" -Urls @(
    "https://www.soundjay.com/nature/sounds/forest-04.mp3",
    "https://actions.google.com/sounds/v1/ambiences/forest_morning.ogg" # Might fail
)

# 5. Download Cafe Sound
Download-File -Name "cafe.mp3" -Dest "$soundsDir/cafe.mp3" -Urls @(
    "https://www.soundjay.com/misc/sounds/restaurant-ambience-1.mp3",
    "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg" # Might fail
)

Write-Host "🎉 Asset download process finished."
