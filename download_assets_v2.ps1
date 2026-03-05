$userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

# Ensure directories exist
New-Item -ItemType Directory -Force -Path "public/fonts" | Out-Null
New-Item -ItemType Directory -Force -Path "public/videos/backgrounds" | Out-Null

function Download-Asset {
    param ($Url, $Dest)
    Write-Host "Downloading $Dest..."
    try {
        # Using curl.exe if available (often better for redirects/headers on Windows than Invoke-WebRequest sometimes)
        # But Invoke-WebRequest is native. Let's try Invoke-WebRequest with quoted URL.
        Invoke-WebRequest -Uri $Url -OutFile $Dest -UserAgent $userAgent -ErrorAction Stop
        $size = (Get-Item $Dest).Length
        if ($size -lt 1000) {
            Write-Warning "File $Dest is too small ($size bytes). Likely a redirect or error page."
            # Remove invalid file
            Remove-Item $Dest
        } else {
            Write-Host "Success: $Dest ($($size/1MB) MB)"
        }
    } catch {
        Write-Warning "Failed to download $Dest : $_"
    }
}

# 1. Fonts (Reliable GitHub Raw Links)
# Ma Shan Zheng
Download-Asset "https://raw.githubusercontent.com/google/fonts/main/ofl/mashanzheng/MaShanZheng-Regular.ttf" "public/fonts/MaShanZheng-Regular.ttf"
# ZCOOL KuaiLe (Re-downloading to be safe)
Download-Asset "https://raw.githubusercontent.com/google/fonts/main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf" "public/fonts/ZCOOLKuaiLe-Regular.ttf"
# Noto Serif SC (Trying GitHub raw)
Download-Asset "https://github.com/google/fonts/raw/main/ofl/notoserifsc/NotoSerifSC-Regular.otf" "public/fonts/NotoSerifSC-Regular.otf"
# Noto Sans SC (Another large font)
Download-Asset "https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC-Regular.otf" "public/fonts/NotoSansSC-Regular.otf"

# 2. Videos (Pixabay with quoted URLs and User-Agent)
# Rain on Window
Download-Asset "https://pixabay.com/videos/download/video-31635_medium.mp4?attachment" "public/videos/backgrounds/rain_window.mp4"
# Calm Sea
Download-Asset "https://pixabay.com/videos/download/video-2439_medium.mp4?attachment" "public/videos/backgrounds/calm_sea.mp4"
# Forest/Nature
Download-Asset "https://pixabay.com/videos/download/video-6395_medium.mp4?attachment" "public/videos/backgrounds/forest.mp4"

# 3. Sounds (Re-downloading to ensure not 0 bytes)
Download-Asset "https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8c8a73467.mp3?filename=rain-112349.mp3" "public/sounds/rain.mp3"
Download-Asset "https://cdn.pixabay.com/download/audio/2022/03/15/audio_275553b926.mp3?filename=cafe-ambience-110034.mp3" "public/sounds/cafe.mp3"
Download-Asset "https://cdn.pixabay.com/download/audio/2022/03/09/audio_822004245b.mp3?filename=ocean-waves-111774.mp3" "public/sounds/ocean.mp3"

# Check sizes
Write-Host "`nFinal Asset Check:"
Get-ChildItem -Recurse public/fonts, public/videos/backgrounds, public/sounds | Select-Object Name, @{Name="Size(MB)";Expression={"{0:N2}" -f ($_.Length / 1MB)}}
