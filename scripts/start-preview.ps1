param([switch]$Stop)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$servePath = Join-Path $projectRoot 'scripts/serve.mjs'
$pidPath = Join-Path $projectRoot 'private/preview.pid'
if (Test-Path -LiteralPath $pidPath) {
  $previewProcessId = [int]([System.IO.File]::ReadAllText($pidPath).Trim())
  $previewProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$previewProcessId"
  if ($previewProcess -and $previewProcess.CommandLine.Contains($servePath)) {
    if ($Stop) { Stop-Process -Id $previewProcessId; Remove-Item -LiteralPath $pidPath; Write-Output 'Portfolio preview stopped.'; exit }
    Write-Output 'Portfolio preview is already running: http://127.0.0.1:4173'; exit
  }
}
if ($Stop) { Write-Output 'No background portfolio preview is running.'; exit }
New-Item -ItemType Directory -Path (Join-Path $projectRoot 'private') -Force | Out-Null
$previewNode = (Get-Command node).Source
$previewProcess = Start-Process -FilePath $previewNode -ArgumentList @(('"' + $servePath + '"'),'--watch') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot 'private/preview.stdout.log') -RedirectStandardError (Join-Path $projectRoot 'private/preview.stderr.log') -PassThru
[System.IO.File]::WriteAllText($pidPath,[string]$previewProcess.Id)
for ($attempt=0; $attempt -lt 20; $attempt++) {
  if ($previewProcess.HasExited) { throw 'Preview failed to start. See private/preview.stderr.log.' }
  try {
    $response = Invoke-WebRequest -Uri 'http://127.0.0.1:4173/' -UseBasicParsing -TimeoutSec 1
    if ($response.StatusCode -eq 200) { Write-Output 'Portfolio preview: http://127.0.0.1:4173'; exit }
  } catch { }
  Start-Sleep -Milliseconds 250
}
throw 'Preview did not become ready. See private/preview.stderr.log.'
