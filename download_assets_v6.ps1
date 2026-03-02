# Echoes Asset Downloader v6 (The Ultimate Source)
# Uses Wikimedia Commons direct links which are usually very stable and allow hotlinking.

$ErrorActionPreference = "Continue"
$soundsDir = "public/sounds"

function Download-File {
    param ($Name, $Dest, $Urls)
    
    Write-Host "⬇️ Attempting to download $Name..."
    foreach ($url in $Urls) {
        try {
            Write-Host "   Trying: $url"
            # Using a simple user agent
            Invoke-WebRequest -Uri $url -OutFile $Dest -UserAgent "Mozilla/5.0" -TimeoutSec 30
            
            if (Test-Path $Dest) {
                $item = Get-Item $Dest
                if ($item.Length -gt 50KB) {
                    Write-Host "   ✅ Success! ($([math]::Round($item.Length/1MB, 2)) MB)"
                    return $true
                }
            }
        } catch {
            Write-Warning "   ❌ Failed: $_"
        }
    }
    Write-Error "🔥 All mirrors failed for $Name"
    return $false
}

# 1. Ocean (Wikimedia Commons)
# Source: https://commons.wikimedia.org/wiki/File:Ocean_waves.ogg
Download-File -Name "ocean.mp3" -Dest "$soundsDir/ocean.mp3" -Urls @(
    "https://upload.wikimedia.org/wikipedia/commons/e/e0/Ocean_waves.ogg",
    "https://upload.wikimedia.org/wikipedia/commons/7/74/White_Noise.ogg" # Fallback
)

# 2. Forest (Wikimedia Commons)
# Source: https://commons.wikimedia.org/wiki/File:Forest_ambience_-_birds.ogg
Download-File -Name "forest.mp3" -Dest "$soundsDir/forest.mp3" -Urls @(
    "https://upload.wikimedia.org/wikipedia/commons/a/a2/Forest_ambience_-_birds.ogg",
    "https://upload.wikimedia.org/wikipedia/commons/5/5b/Forest_Sounds.ogg"
)

Write-Host "🎉 Asset fix v6 complete!"
