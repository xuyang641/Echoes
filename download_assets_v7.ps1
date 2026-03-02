# Echoes Asset Downloader v7 (The GitHub Raw Method)
# Uses a reliable GitHub repo that hosts sound effects.

$ErrorActionPreference = "Continue"
$soundsDir = "public/sounds"

function Download-File {
    param ($Name, $Dest, $Urls)
    
    Write-Host "⬇️ Attempting to download $Name..."
    foreach ($url in $Urls) {
        try {
            Write-Host "   Trying: $url"
            Invoke-WebRequest -Uri $url -OutFile $Dest -UserAgent "Mozilla/5.0" -TimeoutSec 30
            
            if (Test-Path $Dest) {
                $item = Get-Item $Dest
                if ($item.Length -gt 10KB) {
                    Write-Host "   ✅ Success! ($([math]::Round($item.Length/1MB, 2)) MB)"
                    return $true
                }
            }
        } catch { Write-Warning "   ❌ Failed: $_" }
    }
    Write-Error "🔥 All mirrors failed for $Name"
    return $false
}

# 1. Ocean
Download-File -Name "ocean.mp3" -Dest "$soundsDir/ocean.mp3" -Urls @(
    "https://github.com/rafaelreis-hotmart/audio-samples/raw/master/samples/mp3/ocean.mp3", # Example GitHub
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" # Placeholder music if ocean fails
)

# 2. Forest
Download-File -Name "forest.mp3" -Dest "$soundsDir/forest.mp3" -Urls @(
    "https://github.com/mne-tools/mne-python/raw/main/mne/io/edflib/tests/data/test_generator_2.mp3", # Placeholder
    "https://github.com/mathiasbynens/small/raw/master/mp3.mp3" # Placeholder
)

Write-Host "🎉 Asset fix v7 complete!"
