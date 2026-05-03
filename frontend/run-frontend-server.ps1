$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot

$node = 'C:\Program Files\nodejs\node.exe'
$log = Join-Path $PSScriptRoot 'frontend.log'
$err = Join-Path $PSScriptRoot 'frontend.err.log'

& $node 'node_modules\vite\bin\vite.js' '--host' '127.0.0.1' 1>> $log 2>> $err
