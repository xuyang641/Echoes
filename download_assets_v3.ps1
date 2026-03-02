# Echoes Asset Downloader v3
# Fixed URLs for fonts and missing sounds.

$ErrorActionPreference = "Continue"

$soundsDir = "public/sounds"
$fontsDir = "public/fonts"

function Download-File {
    param ($Name, $Dest, $Urls)
    Write-Host "⬇️ Attempting to download $Name..."
    foreach ($url in $Urls) {
        try {
            Write-Host "   Trying: $url"
            Invoke-WebRequest -Uri $url -OutFile $Dest -UserAgent "Mozilla/5.0" -TimeoutSec 20
            $item = Get-Item $Dest
            if ($item.Length -gt 10KB) {
                Write-Host "   ✅ Success! ($([math]::Round($item.Length/1MB, 2)) MB)"
                return
            }
        } catch { Write-Warning "   ❌ Failed: $_" }
    }
    Write-Error "🔥 All mirrors failed for $Name"
}

# 1. Font: Use WOFF2 from jsDelivr (Very stable)
# Note: Changing extension to .woff2
Download-File -Name "lxgw-wenkai-regular.woff2" -Dest "$fontsDir/lxgw-wenkai-regular.woff2" -Urls @(
    "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.6.0/lxgw-wenkai-regular.woff2",
    "https://cdn.jsdelivr.net/npm/lxgw-wenkai-lite-webfont@1.1.0/lxgw-wenkai-lite-regular.woff2"
)

# 2. Ocean: Try BigSoundBank or Wikipedia
Download-File -Name "ocean.mp3" -Dest "$soundsDir/ocean.mp3" -Urls @(
    "https://upload.wikimedia.org/wikipedia/commons/e/e0/Ocean_waves.ogg", 
    "https://actions.google.com/sounds/v1/water/waves_crashing_on_rocks_beach.ogg"
)

# 3. Forest: Try Wikipedia or BigSoundBank
Download-File -Name "forest.mp3" -Dest "$soundsDir/forest.mp3" -Urls @(
    "https://upload.wikimedia.org/wikipedia/commons/a/a2/Forest_ambience_-_birds.ogg",
    "https://actions.google.com/sounds/v1/animals/birds_forest_morning.ogg"
)

# Note: Rain and Cafe were already successful in previous run, but we can re-verify if needed.
# Since they are already there (checked by previous command success), we skip unless missing.
if (-not (Test-Path "$soundsDir/rain.mp3")) {
    Write-Warning "rain.mp3 missing, please re-run v2 script for it."
}
if (-not (Test-Path "$soundsDir/cafe.mp3")) {
    Write-Warning "cafe.mp3 missing, please re-run v2 script for it."
}

Write-Host "🎉 Asset download v3 complete!"
