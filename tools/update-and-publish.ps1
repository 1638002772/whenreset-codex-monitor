$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonExe = (Get-Command python.exe -ErrorAction Stop).Source
$logDirectory = Join-Path $projectRoot 'data\diagnostics'
$logPath = Join-Path $logDirectory 'github-pages-sync.log'
$monitorExitCode = 0

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
Start-Transcript -Path $logPath -Append | Out-Null
try {
    Set-Location $projectRoot

    & git pull --ff-only origin main
    if ($LASTEXITCODE -ne 0) { throw 'Could not fast-forward from origin/main.' }

    & $pythonExe (Join-Path $projectRoot 'monitor.py') --once
    $monitorExitCode = $LASTEXITCODE
    if ($monitorExitCode -ne 0) { Write-Warning 'The X fetch failed; publishing the updated monitor status anyway.' }

    & $pythonExe (Join-Path $projectRoot 'tools\build_site.py')
    if ($LASTEXITCODE -ne 0) { throw 'Could not build the static site data.' }

    & git add -- data/state.json data/posts.json data/events.json data/site-data.json
    if ($LASTEXITCODE -ne 0) { throw 'Could not stage monitor data.' }

    & git diff --cached --quiet
    if ($LASTEXITCODE -eq 1) {
        & git commit -m 'Update public reset monitor data'
        if ($LASTEXITCODE -ne 0) { throw 'Could not commit monitor data.' }
        & git push origin main
        if ($LASTEXITCODE -ne 0) { throw 'Could not push monitor data to GitHub.' }
    } elseif ($LASTEXITCODE -ne 0) {
        throw 'Could not inspect staged monitor changes.'
    }
} finally {
    Stop-Transcript | Out-Null
}

if ($monitorExitCode -ne 0) { exit $monitorExitCode }
