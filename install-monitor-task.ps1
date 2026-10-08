$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonExe = (Get-Command python.exe -ErrorAction Stop).Source
$scriptPath = Join-Path $projectRoot 'monitor.py'
$taskName = 'WHENRESET public X monitor'

if (-not (Test-Path -LiteralPath $pythonExe)) {
    throw "Python was not found at $pythonExe"
}

$action = New-ScheduledTaskAction -Execute $pythonExe -Argument "`"$scriptPath`" --once" -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 2)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Fetch public @thsottiaux Posts and update the local WHENRESET site without LLM/API calls.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Write-Output "Installed and started: $taskName (every 5 minutes while this Windows account is logged in)."
