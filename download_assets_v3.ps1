$userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

# Ensure directories exist
New-Item -ItemType Directory -Force -Path "public/fonts" | Out-Null
New-Item -ItemType Directory -Force -Path "public/videos/backgrounds" | Out-Null
New-Item -ItemType Directory -Force -Path "public/sounds" | Out-Null

function Download-Asset {
    param ($Url, $Dest)
    Write-Host "Downloading $Dest..."
    try {
        Invoke-WebRequest -Uri $Url -OutFile $Dest -UserAgent $userAgent -ErrorAction Stop
        $size = (Get-Item $Dest).Length
        if ($size -lt 5000) { # < 5KB is likely an error page
            Write-Warning "File $Dest is too small ($size bytes). Likely an error."
            Remove-Item $Dest
        } else {
            Write-Host "Success: $Dest ($($size/1MB) MB)"
        }
    } catch {
        Write-Warning "Failed to download $Dest : $_"
    }
}

# 1. Fonts (Using jsDelivr for reliability)
# Noto Serif SC
Download-Asset "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notoserifsc/NotoSerifSC-Regular.otf" "public/fonts/NotoSerifSC-Regular.otf"
# Noto Sans SC
Download-Asset "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosanssc/NotoSansSC-Regular.otf" "public/fonts/NotoSansSC-Regular.otf"
# LXGW WenKai Light (Adding more weight)
Download-Asset "https://github.com/lxgw/LxgwWenKai/releases/download/v1.330/LXGWWenKai-Light.ttf" "public/fonts/LXGWWenKai-Light.ttf"

# 2. Videos (Archive.org - No 403s)
# Rain (Confirmed item)
Download-Asset "https://archive.org/download/littlecloudcinema_rainyday/rain3.mp4" "public/videos/backgrounds/rain_window.mp4"

# Ocean (Best guess from search)
# Try a known Archive.org item "Ocean_Waves_Stock_Footage"
Download-Asset "https://archive.org/download/StockFootageOceanWaves/StockFootageOceanWaves.mp4" "public/videos/backgrounds/calm_sea.mp4"

# Forest (Best guess)
# Try "forest_201503"
Download-Asset "https://archive.org/download/forest_201503/forest.mp4" "public/videos/backgrounds/forest.mp4"

# 3. Sounds (Archive.org)
# Rain
Download-Asset "https://archive.org/download/RainSound13/Gentle%20Rain%20and%20Thunder.mp3" "public/sounds/rain.mp3"
# Ocean
Download-Asset "https://archive.org/download/OceanSounds_201605/Ocean%20Sounds.mp3" "public/sounds/ocean.mp3"
# Cafe (Trying a specific one or generic)
Download-Asset "https://archive.org/download/coffee-shop-sound-effect/Coffee%20Shop%20Sound%20Effect.mp3" "public/sounds/cafe.mp3"

# Check sizes
Write-Host "`nFinal Asset Check:"
Get-ChildItem -Recurse public/fonts, public/videos/backgrounds, public/sounds | Select-Object Name, @{Name="Size(MB)";Expression={"{0:N2}" -f ($_.Length / 1MB)}}
