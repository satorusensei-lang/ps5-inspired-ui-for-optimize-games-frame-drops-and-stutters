Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\XboxGames\MYRAA"
WshShell.Run """node_modules\electron\dist\electron.exe"" .", 0, False
