Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile('C:\Program Files (x86)\Steam\appcache\librarycache\2215430\library_hero.jpg')

for ($y = 120; $y -le 165; $y += 10) {
    for ($x = 1250; $x -le 1320; $x += 5) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -lt 140) {
            Write-Host "y=$y x=$x Jin gear: R=$($p.R) G=$($p.G) B=$($p.B)"
        }
    }
}
$bmp.Dispose()
