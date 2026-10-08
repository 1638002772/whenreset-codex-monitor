$ErrorActionPreference = 'Stop'
$taskName = 'WHENRESET public X monitor'
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Write-Output "Removed: $taskName"
