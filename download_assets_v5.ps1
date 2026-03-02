# Echoes Asset Downloader v5 (Targeted Fix)
# Specifically downloads Forest and Ocean sounds from reliable sources.

$ErrorActionPreference = "Continue"
$soundsDir = "public/sounds"

function Download-File {
    param ($Name, $Dest, $Urls)
    
    Write-Host "⬇️ Attempting to download $Name..."
    foreach ($url in $Urls) {
        try {
            Write-Host "   Trying: $url"
            # Use a browser-like User Agent to avoid 403 Forbidden
            Invoke-WebRequest -Uri $url -OutFile $Dest -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" -TimeoutSec 30
            
            if (Test-Path $Dest) {
                $item = Get-Item $Dest
                # Check for valid MP3 size (at least 100KB)
                if ($item.Length -gt 100KB) {
                    Write-Host "   ✅ Success! ($([math]::Round($item.Length/1MB, 2)) MB)"
                    return $true
                } else {
                    Write-Warning "   ⚠️ File too small ($($item.Length) bytes), likely an error page."
                    Remove-Item $Dest -ErrorAction SilentlyContinue
                }
            }
        } catch {
            Write-Warning "   ❌ Failed: $_"
        }
    }
    Write-Error "🔥 All mirrors failed for $Name"
    return $false
}

# 1. Download Ocean (Specific reliable sources)
# Using direct GitHub raw links or reliable CDNs often works better than scraping
Download-File -Name "ocean.mp3" -Dest "$soundsDir/ocean.mp3" -Urls @(
    "https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8c8a73467.mp3", # Ocean Waves
    "https://actions.google.com/sounds/v1/water/waves_crashing_on_rocks_beach.ogg" # Google Backup
)

# 2. Download Forest (Specific reliable sources)
Download-File -Name "forest.mp3" -Dest "$soundsDir/forest.mp3" -Urls @(
    "https://cdn.pixabay.com/download/audio/2021/09/06/audio_346bf2f53d.mp3", # Forest Birds
    "https://actions.google.com/sounds/v1/animals/birds_forest_morning.ogg" # Google Backup
)

Write-Host "🎉 Targeted asset fix complete!"
