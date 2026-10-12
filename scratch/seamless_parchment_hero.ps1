Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Program Files (x86)\Steam\appcache\librarycache\2215430\library_hero.jpg"
$outPath = "C:\XboxGames\MYRAA\public\assets\games\got\hero.jpg"

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $bmp.Width
$height = $bmp.Height

Write-Host "Image size: $width x $height"

# Patch source rectangle: clean parchment from the left area (y=220 to y=395, x=150 to x=650)
$patchX0 = 150
$patchY0 = 220
$patchW = 500
$patchH = 175

# Create a clean patch bitmap
$patch = New-Object System.Drawing.Bitmap($patchW, $patchH)
for ($px = 0; $px -lt $patchW; $px++) {
    for ($py = 0; $py -lt $patchH; $py++) {
        $c = $bmp.GetPixel($patchX0 + $px, $patchY0 + $py)
        $patch.SetPixel($px, $py, $c)
    }
}

# Now for each pixel in y=0..170 across all columns x=0..width-1:
for ($x = 0; $x -lt $width; $x++) {
    $px = $x % $patchW
    if ([int]($x / $patchW) % 2 -eq 1) {
        $px = $patchW - 1 - $px
    }
    
    for ($y = 0; $y -le 172; $y++) {
        $orig = $bmp.GetPixel($x, $y)
        
        $isJin = $false
        if ($x -ge 860 -and $x -le 1262) {
            # Jin's hair, headband, face, armor, bow, string, tassels
            if ($orig.R -lt 110 -and $orig.G -lt 105 -and $orig.B -lt 95) {
                $isJin = $true
            }
            # White / light lettering on Jin's headband (at y ~ 80 to 118, x ~ 880 to 955)
            if ($y -ge 80 -and $y -le 118 -and $x -ge 880 -and $x -le 955) {
                $isJin = $true
            }
            # Bow string and wraps
            if ($x -ge 1205 -and $x -le 1262 -and $orig.R -lt 140) {
                $isJin = $true
            }
        }
        
        # If it's part of Jin, keep original pixel intact
        if ($isJin) {
            continue
        }
        
        # Get parchment replacement pixel
        $py = [Math]::Min($patchH - 1, $y)
        $parchmentPixel = $patch.GetPixel($px, $py)
        
        # Feather smoothly into the lower parchment at y=152..172
        if ($y -ge 152) {
            $t = ($y - 152) / 20.0
            $t = $t * $t * (3.0 - 2.0 * $t)
            $r = [int]([Math]::Round($parchmentPixel.R * (1.0 - $t) + $orig.R * $t))
            $g = [int]([Math]::Round($parchmentPixel.G * (1.0 - $t) + $orig.G * $t))
            $b = [int]([Math]::Round($parchmentPixel.B * (1.0 - $t) + $orig.B * $t))
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($r, $g, $b))
        } else {
            $bmp.SetPixel($x, $y, $parchmentPixel)
        }
    }
}

$patch.Dispose()

# Save as high quality JPEG (quality 98)
$encoder = [System.Drawing.Imaging.Encoder]::Quality
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [long]98)
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }

$bmp.Save($outPath, $codec, $encoderParams)
$bmp.Dispose()

Write-Host "Master clean Jin Sakai hero successfully saved directly to $outPath"
