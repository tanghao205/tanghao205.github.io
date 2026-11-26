param([switch]$TestDigest)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$watchPreviewRunning = $false
try {
  $previewResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:4173/' -UseBasicParsing -TimeoutSec 2
  $watchPreviewRunning = $previewResponse.Content.Contains('/__reload')
} catch { }
if ($watchPreviewRunning) { throw 'Stop npm run dev with Ctrl+C before applying settings, then restart it afterward. This avoids two processes rebuilding dist at once.' }
$runtimePath = Join-Path $projectRoot 'private/supabase-runtime.env'
if (-not (Test-Path -LiteralPath $runtimePath)) { throw 'Create private/supabase-runtime.env first.' }
$runtimeText = [System.IO.File]::ReadAllText($runtimePath)
$settings = @{}
foreach ($line in ($runtimeText -split "`n")) {
  if ($line -match '^([A-Z_]+)=(.*)$') { $settings[$Matches[1]] = $Matches[2].Trim() }
}
# Validate retention before uploading secrets or mutating hosted settings.
foreach ($setting in @('NETWORK_RETENTION_DAYS','VISIT_RETENTION_DAYS')) {
  if (-not $settings[$setting]) {
    if ($setting -eq 'NETWORK_RETENTION_DAYS') { $settings[$setting] = '30' }
    else { $settings[$setting] = '90' }
  }
  if ($settings[$setting] -ieq 'unlimited') { $settings[$setting] = 'unlimited' }
  elseif ($settings[$setting] -notmatch '^[1-9][0-9]{0,3}$' -or [int]$settings[$setting] -gt 3650) {
    throw "$setting must be unlimited or a whole number from 1 through 3650. Nothing was uploaded."
  }
}
if (-not $settings['DIGEST_JOB_SECRET']) {
  $randomBytes = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($randomBytes)
  $rng.Dispose()
  $settings['DIGEST_JOB_SECRET'] = ([System.BitConverter]::ToString($randomBytes)).Replace('-','').ToLowerInvariant()
}
foreach ($setting in @('DIGEST_JOB_SECRET','GEO_LOOKUP_ENABLED','IMMEDIATE_NOTIFICATIONS','NETWORK_RETENTION_DAYS','VISIT_RETENTION_DAYS')) {
  if ($setting -eq 'GEO_LOOKUP_ENABLED' -and -not $settings[$setting]) { $settings[$setting] = 'true' }
  if ($setting -eq 'IMMEDIATE_NOTIFICATIONS' -and -not $settings[$setting]) { $settings[$setting] = 'false' }
  $settingLine = $setting + '=' + $settings[$setting]
  if ($runtimeText -match "(?m)^$setting=.*$") {
    $runtimeText = [regex]::Replace($runtimeText,"(?m)^$setting=.*$",$settingLine)
  } else { $runtimeText = $runtimeText.TrimEnd() + "`n" + $settingLine + "`n" }
}
[System.IO.File]::WriteAllText($runtimePath,$runtimeText,[System.Text.UTF8Encoding]::new($false))
& npx --yes supabase secrets set --env-file private/supabase-runtime.env --remote=bqdhhsrezdkaqvwgyncz --yes --agent no --output-format text
if ($LASTEXITCODE -ne 0) { throw 'Secret upload failed.' }

# Pass the credential in a private file rather than command-line arguments.
$vaultPath = Join-Path $projectRoot 'private/digest-vault-setup.sql'
$jobSecret = $settings['DIGEST_JOB_SECRET']
if ($jobSecret -notmatch '^[a-f0-9]{64}$') { throw 'DIGEST_JOB_SECRET must be 64 lowercase hexadecimal characters.' }
$vaultSql = @'
do $setup$
declare existing_id uuid;
begin
 select id into existing_id from vault.secrets where name='portfolio_digest_job_secret' limit 1;
 if existing_id is null then
  perform vault.create_secret('__JOB_SECRET__','portfolio_digest_job_secret');
 else
  perform vault.update_secret(existing_id,'__JOB_SECRET__');
 end if;
end; $setup$;
update public.messaging_settings set network_retention_days=__NETWORK_DAYS__,
  visit_retention_days=__VISIT_DAYS__ where singleton;
'@
$vaultSql = $vaultSql.Replace('__JOB_SECRET__',$jobSecret)
$networkSql = $settings['NETWORK_RETENTION_DAYS']
$visitSql = $settings['VISIT_RETENTION_DAYS']
if ($networkSql -eq 'unlimited') { $networkSql = 'NULL' }
if ($visitSql -eq 'unlimited') { $visitSql = 'NULL' }
$vaultSql = $vaultSql.Replace('__NETWORK_DAYS__',$networkSql).Replace('__VISIT_DAYS__',$visitSql)
[System.IO.File]::WriteAllText($vaultPath,$vaultSql,[System.Text.UTF8Encoding]::new($false))
try {
  & npx --yes supabase db query --remote --file private/digest-vault-setup.sql --yes --agent no --output-format text
  if ($LASTEXITCODE -ne 0) { throw 'Vault setup failed.' }
} finally { Remove-Item -LiteralPath $vaultPath -Force }
Write-Output 'Runtime settings uploaded and scheduler credential stored in Vault.'
# Only validated retention numbers enter public HTML, never the private file.
$indexPath = Join-Path $projectRoot 'index.html'
$indexText = [System.IO.File]::ReadAllText($indexPath)
foreach ($noticeSetting in @(@('network','NETWORK_RETENTION_DAYS'),@('visit','VISIT_RETENTION_DAYS'))) {
  $noticePattern = '(<span data-retention="' + $noticeSetting[0] + '">)[^<]*(</span>)'
  if (-not [regex]::IsMatch($indexText,$noticePattern)) { throw 'Retention notice marker missing in index.html; update the public notice before publishing.' }
  $noticeValue = $settings[$noticeSetting[1]]
  if ($noticeValue -eq 'unlimited') { $noticeValue = 'no automatic expiry' }
  else { $noticeValue = $noticeValue + ' days' }
  $indexText = [regex]::Replace($indexText,$noticePattern,{param($match) $match.Groups[1].Value + $noticeValue + $match.Groups[2].Value})
}
if ([System.IO.File]::ReadAllText($indexPath) -ne $indexText) {
  [System.IO.File]::WriteAllText($indexPath,$indexText,[System.Text.UTF8Encoding]::new($false))
}
& npm run build
if ($LASTEXITCODE -ne 0) { throw 'Settings applied, but rebuilding the local notice failed.' }
& npm run check
if ($LASTEXITCODE -ne 0) { throw 'Settings applied, but public-file checks failed.' }
Write-Output ('Retention applied (days or unlimited): network details ' + $settings['NETWORK_RETENTION_DAYS'] + '; visit records ' + $settings['VISIT_RETENTION_DAYS'] + '.')
Write-Output 'The local privacy notice is updated. A published website needs a separately authorized update.'
if ($TestDigest) {
  if (-not $settings['RESEND_API_KEY'] -or -not $settings['NOTIFICATION_FROM'] -or -not $settings['NOTIFICATION_TO']) {
    throw 'Set RESEND_API_KEY, NOTIFICATION_FROM and NOTIFICATION_TO before testing email.'
  }
  $result = Invoke-RestMethod -Uri 'https://bqdhhsrezdkaqvwgyncz.supabase.co/functions/v1/weekly-digest' -Method Post -Headers @{Authorization=('Bearer ' + $jobSecret)} -ContentType 'application/json' -Body '{}'
  Write-Output $result.message
}
