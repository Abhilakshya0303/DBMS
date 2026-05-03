$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot

$node = 'C:\Program Files\nodejs\node.exe'
$mysqlAdmin = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqladmin.exe'
$log = Join-Path $PSScriptRoot 'backend.log'
$err = Join-Path $PSScriptRoot 'backend.err.log'

powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'start-local-mysql.ps1') | Out-Null

for ($i = 0; $i -lt 20; $i++) {
  & $mysqlAdmin '--host=127.0.0.1' '--port=3307' '--user=room_app' '--password=RoomApp!2026' ping | Out-Null
  if ($LASTEXITCODE -eq 0) { break }
  Start-Sleep -Seconds 1
}

& $node 'server.js' 1>> $log 2>> $err
