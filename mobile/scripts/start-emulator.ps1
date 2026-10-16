# Boots the Android emulator and makes sure adb can talk to it.
# Usage: npm run emulator            (uses the first AVD)
#        npm run emulator -- MyAvd   (uses a specific AVD)
param([string]$Avd)

$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$emulator = Join-Path $sdk "emulator\emulator.exe"
$adb = Join-Path $sdk "platform-tools\adb.exe"

$avds = @(& $emulator -list-avds 2>$null | Where-Object { $_ -and $_ -notmatch "INFO" })
if (-not $avds) { Write-Error "No AVD found. Create one in Android Studio > Device Manager."; exit 1 }
if (-not $Avd) { $Avd = $avds[0] }
if ($avds -notcontains $Avd) { Write-Error "AVD '$Avd' not found. Available: $($avds -join ', ')"; exit 1 }

$proc = $null
$running = (& $adb devices) -match "^emulator-"
if (-not $running) {
  Write-Host "Starting emulator '$Avd' (first boot can take a few minutes)..."
  $proc = Start-Process -FilePath $emulator -ArgumentList "-avd $Avd -no-snapshot-load -gpu angle_indirect -no-boot-anim" -PassThru
}

for ($i = 0; $i -lt 150; $i++) {
  if ($proc -and $proc.HasExited) { Write-Error "Emulator exited (code $($proc.ExitCode)). Try starting it from Android Studio > Device Manager to see the error."; exit 1 }
  $state = (& $adb devices) | Select-String "^emulator-\S+\s+(\S+)" | ForEach-Object { $_.Matches[0].Groups[1].Value } | Select-Object -First 1
  if ($state -eq "unauthorized" -and $i -gt 10) {
    # Stale adb server key - restarting the server re-sends the key from ~/.android/adbkey
    Write-Host "Device unauthorized, restarting adb server..."
    & $adb kill-server | Out-Null
    & $adb start-server | Out-Null
  }
  if ($state -eq "device" -and (& $adb shell getprop sys.boot_completed 2>$null) -match "1") {
    Write-Host "Emulator is ready. Run: npm run android"
    exit 0
  }
  Start-Sleep 2
}
Write-Error "Emulator did not become ready in time. Try: adb kill-server, then run this again."
exit 1
