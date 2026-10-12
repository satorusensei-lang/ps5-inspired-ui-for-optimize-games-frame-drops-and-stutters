Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile('C:\Program Files (x86)\Steam\appcache\librarycache\2215430\library_hero.jpg')

for ($y = 115; $y -le 165; $y += 5) {
    $c = $bmp.GetPixel(300, $y)
    Write-Host "y=$y R=$($c.R) G=$($c.G) B=$($c.B)"
}
$bmp.Dispose()
