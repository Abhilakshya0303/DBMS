$ErrorActionPreference = 'Stop'

$mysqlBin = 'C:\Program Files\MySQL\MySQL Server 8.0\bin'
$mysqld = Join-Path $mysqlBin 'mysqld.exe'
$mysqlAdmin = Join-Path $mysqlBin 'mysqladmin.exe'
$config = Join-Path $PSScriptRoot 'mysql-dev.ini'
$log = Join-Path $PSScriptRoot 'mysql-dev.log'
$err = Join-Path $PSScriptRoot 'mysql-dev.err.log'

& $mysqlAdmin '--host=127.0.0.1' '--port=3307' '--user=room_app' '--password=RoomApp!2026' ping | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Output 'Project-local MySQL is already running on 127.0.0.1:3307.'
  exit 0
}

$proc = Start-Process -FilePath $mysqld -ArgumentList "--defaults-file=$config",'--console' -RedirectStandardOutput $log -RedirectStandardError $err -PassThru
Start-Sleep -Seconds 4

& $mysqlAdmin '--host=127.0.0.1' '--port=3307' '--user=room_app' '--password=RoomApp!2026' ping | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Project-local MySQL failed to start. Check $err"
}

Write-Output "Project-local MySQL started on 127.0.0.1:3307 (PID $($proc.Id))."
