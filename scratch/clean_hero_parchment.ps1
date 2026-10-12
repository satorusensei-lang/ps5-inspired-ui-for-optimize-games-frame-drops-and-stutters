Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\vedda\.gemini\antigravity-ide\brain\a3738e15-3aef-4379-ae22-b629fab546fc\scratch\hero_2215430.jpg"
$outPath = "C:\XboxGames\MYRAA\public\assets\games\got\hero.jpg"

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $bmp.Width
$height = $bmp.Height

# Target: replace the golden patterned band (y=0 to 115) with the clean parchment background (y=130 to 220)
# Jin Sakai's head/hair is at x between 820 and 1150 and has very dark pixels (brightness < 80)
# We sample parchment from below (e.g. y = 140 to 220) with subtle random jitter to maintain natural paper grain
$rand = New-Object System.Random(42)

for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -le 118; $y++) {
        $orig = $bmp.GetPixel($x, $y)
        
        # Check if this pixel is part of Jin's black hair/headband/head
        $isJinHair = ($x -ge 840 -and $x -le 1140 -and ($orig.R -lt 70 -and $orig.G -lt 70 -and $orig.B -lt 70))
        
        if (-not $isJinHair) {
            # Sample from clean parchment area below (y between 140 and 200)
            $sampleY = 145 + ($y % 40) + $rand.Next(-3, 4)
            if ($sampleY -ge $height) { $sampleY = 150 }
            
            # For x, use sample with slight jitter
            $sampleX = $x + $rand.Next(-5, 6)
            if ($sampleX -lt 0) { $sampleX = 0 }
            if ($sampleX -ge $width) { $sampleX = $width - 1 }
            
            $parchmentPixel = $bmp.GetPixel($sampleX, $sampleY)
            
            # Smooth feathering near y = 110-118
            if ($y -ge 112) {
                $alpha = ($y - 112) / 6.0
                $r = [int]($orig.R * $alpha + $parchmentPixel.R * (1.0 - $alpha))
                $g = [int]($orig.G * $alpha + $parchmentPixel.G * (1.0 - $alpha))
                $b = [int]($orig.B * $alpha + $parchmentPixel.B * (1.0 - $alpha))
                $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($r, $g, $b))
            } else {
                $bmp.SetPixel($x, $y, $parchmentPixel)
            }
        }
    }
}

# Save as high-quality JPEG
$encoder = [System.Drawing.Imaging.Encoder]::Quality
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [long]96)
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }

$bmp.Save($outPath, $codec, $encoderParams)
$bmp.Dispose()

Write-Host "Parchment hero saved to $outPath"
