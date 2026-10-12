Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile('C:\XboxGames\MYRAA\public\assets\games\got\hero.jpg')

for ($y = 0; $y -le 160; $y += 20) {
    $minX = -1
    $maxX = -1
    for ($x = 600; $x -le 1350; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -lt 100 -and $p.G -lt 100 -and $p.B -lt 100) {
            if ($minX -eq -1) { $minX = $x }
            $maxX = $x
        }
    }
    Write-Host "y=$y Jin bounds: minX=$minX maxX=$maxX"
}
$bmp.Dispose()
