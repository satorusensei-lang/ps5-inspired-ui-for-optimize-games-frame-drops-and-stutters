Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\vedda\.gemini\antigravity-ide\brain\a3738e15-3aef-4379-ae22-b629fab546fc\scratch\hero_2215430.jpg"
$outPath = "C:\XboxGames\MYRAA\public\assets\games\got\hero.jpg"

$dir = [System.IO.Path]::GetDirectoryName($outPath)
if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $bmp.Width
$height = $bmp.Height

# We want to remove the sharp gold lines at y=112-122 across the entire width, 
# while preserving Jin Sakai's hair / head in the center (x ~ 830 to 1050)
# For areas that are not Jin's black hair (R, G, B > 80), blend smoothly between y=95 and y=135
$yStart = 95
$yEnd = 135

for ($x = 0; $x -lt $width; $x++) {
    for ($y = $yStart; $y -le $yEnd; $y++) {
        $orig = $bmp.GetPixel($x, $y)
        
        # If it's part of Jin Sakai's black hair / head (very dark pixels), keep it
        $isDarkHair = ($orig.R -lt 75 -and $orig.G -lt 75 -and $orig.B -lt 75)
        if (-not $isDarkHair) {
            # Compute smooth blend factor between top sample (y=92) and bottom sample (y=138)
            $topPixel = $bmp.GetPixel($x, 92)
            $bottomPixel = $bmp.GetPixel($x, 138)
            
            # Avoid sampling dark pixels
            if ($topPixel.R -lt 75) { $topPixel = [System.Drawing.Color]::FromArgb(189, 167, 117) }
            if ($bottomPixel.R -lt 75) { $bottomPixel = [System.Drawing.Color]::FromArgb(250, 245, 242) }
            
            $t = ($y - $yStart) / ($yEnd - $yStart)
            # Smoothstep interpolation
            $smoothT = $t * $t * (3 - 2 * $t)
            
            $newR = [int]([Math]::Round($topPixel.R * (1 - $smoothT) + $bottomPixel.R * $smoothT))
            $newG = [int]([Math]::Round($topPixel.G * (1 - $smoothT) + $bottomPixel.G * $smoothT))
            $newB = [int]([Math]::Round($topPixel.B * (1 - $smoothT) + $bottomPixel.B * $smoothT))
            
            # Clamp
            $newR = [Math]::Max(0, [Math]::Min(255, $newR))
            $newG = [Math]::Max(0, [Math]::Min(255, $newG))
            $newB = [Math]::Max(0, [Math]::Min(255, $newB))
            
            $newColor = [System.Drawing.Color]::FromArgb($newR, $newG, $newB)
            $bmp.SetPixel($x, $y, $newColor)
        }
    }
}

# Save as high quality JPEG
$encoder = [System.Drawing.Imaging.Encoder]::Quality
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [long]95)
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }

$bmp.Save($outPath, $codec, $encoderParams)
$bmp.Dispose()

Write-Host "Successfully generated clean hero at $outPath"
