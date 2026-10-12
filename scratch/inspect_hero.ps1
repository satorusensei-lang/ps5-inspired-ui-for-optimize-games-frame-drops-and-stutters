Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("C:\Program Files (x86)\Steam\appcache\librarycache\2215430\library_hero.jpg")
Write-Host "Width: $($img.Width), Height: $($img.Height)"

for ($y = 0; $y -le 130; $y += 10) {
    $c = $img.GetPixel(300, $y)
    Write-Host "y=$y R=$($c.R) G=$($c.G) B=$($c.B)"
}

$img.Dispose()
