Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Program Files (x86)\Steam\appcache\librarycache\2215430\library_hero.jpg"
$outPath = "C:\XboxGames\MYRAA\public\assets\games\got\hero_healed.jpg"

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $bmp.Width
$height = $bmp.Height

Write-Host "Processing $width x $height..."

# 1. Sample clean parchment colors from y=160-200 (well below any lines, left of Jin)
$cleanParchmentSamples = @()
for ($x = 100; $x -le 600; $x += 20) {
    for ($y = 150; $y -le 190; $y += 10) {
        $c = $bmp.GetPixel($x, $y)
        $cleanParchmentSamples += $c
    }
}
$avgR = [int](($cleanParchmentSamples | Measure-Object -Property R -Average).Average)
$avgG = [int](($cleanParchmentSamples | Measure-Object -Property G -Average).Average)
$avgB = [int](($cleanParchmentSamples | Measure-Object -Property B -Average).Average)
Write-Host "Average parchment color: R=$avgR G=$avgG B=$avgB"

# 2. Seamlessly heal the entire top band (y=0 to y=145) outside of Jin Sakai's silhouette
# Jin Sakai's hair, head, and quiver: dark pixels where R < 95 and G < 95 and B < 95
for ($x = 0; $x -lt $width; $x++) {
    # Sample reference clean parchment for this column at y=150
    $colRef = $bmp.GetPixel($x, 150)
    
    # If the column reference at y=150 is Jin (dark), fall back to average parchment
    if ($colRef.R -lt 110 -and $colRef.G -lt 110 -and $colRef.B -lt 110) {
        $refR = $avgR
        $refG = $avgG
        $refB = $avgB
    } else {
        $refR = $colRef.R
        $refG = $colRef.G
        $refB = $colRef.B
    }

    for ($y = 0; $y -le 142; $y++) {
        $orig = $bmp.GetPixel($x, $y)
        
        # Check if this pixel is part of Jin's hair, headband, head, or quiver
        # Jin's features are dark:
        $isJin = ($orig.R -lt 85 -and $orig.G -lt 85 -and $orig.B -lt 85)
        
        # Also check tassels / ropes which are darker brown/gold (R < 130 and G < 115 and B < 95 and contrast with parchment)
        $isTassel = ($orig.R -lt 130 -and $orig.G -lt 115 -and $orig.B -lt 95 -and ($orig.R - $orig.B) -gt 20 -and $orig.R -lt 140)
        
        if (-not ($isJin -or $isTassel)) {
            # Smooth blend towards the clean parchment
            # If y is near 142, feather into the existing pixel
            $feather = 1.0
            if ($y -gt 132) {
                $feather = (142 - $y) / 10.0
            }
            
            # Subtle natural grain variation based on x and y
            $noise = (($x * 17 + $y * 31) % 7) - 3
            
            $nR = [Math]::Max(0, [Math]::Min(255, [int]([Math]::Round($refR * $feather + $orig.R * (1.0 - $feather) + $noise))))
            $nG = [Math]::Max(0, [Math]::Min(255, [int]([Math]::Round($refG * $feather + $orig.G * (1.0 - $feather) + $noise))))
            $nB = [Math]::Max(0, [Math]::Min(255, [int]([Math]::Round($refB * $feather + $orig.B * (1.0 - $feather) + $noise))))
            
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($nR, $nG, $nB))
        }
    }
}

# Save as high quality JPEG
$encoder = [System.Drawing.Imaging.Encoder]::Quality
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [long]96)
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }

$bmp.Save($outPath, $codec, $encoderParams)
$bmp.Dispose()

Write-Host "Successfully generated healed hero at $outPath"
