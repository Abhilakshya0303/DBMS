$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $root 'backend'
$frontendDir = Join-Path $root 'frontend'
$backendScript = Join-Path $backendDir 'run-backend-server.ps1'
$frontendScript = Join-Path $frontendDir 'run-frontend-server.ps1'
$mysqlScript = Join-Path $backendDir 'start-local-mysql.ps1'
$mysqlAdmin = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqladmin.exe'

function Test-TcpPort {
  param(
    [string]$HostName,
    [int]$Port
  )

  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $async = $client.BeginConnect($HostName, $Port, $null, $null)
    $connected = $async.AsyncWaitHandle.WaitOne(1000, $false)
    if (-not $connected) {
      $client.Close()
      return $false
    }

    $client.EndConnect($async)
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

function Wait-ForBackend {
  for ($i = 0; $i -lt 30; $i++) {
    try {
      $health = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -TimeoutSec 5
      if ($health.success -eq $true -and $health.data_driver -eq 'mysql') {
        return $true
      }
    } catch {}

    Start-Sleep -Seconds 1
  }

  return $false
}

function Wait-ForFrontend {
  for ($i = 0; $i -lt 30; $i++) {
    try {
      $response = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
        return $true
      }
    } catch {}

    Start-Sleep -Seconds 1
  }

  return $false
}

function Wait-ForMysql {
  for ($i = 0; $i -lt 30; $i++) {
    & $mysqlAdmin '--host=127.0.0.1' '--port=3307' '--user=room_app' '--password=RoomApp!2026' ping | Out-Null
    if ($LASTEXITCODE -eq 0) {
      return $true
    }

    Start-Sleep -Seconds 1
  }

  return $false
}

function Start-BackgroundScript {
  param(
    [string]$ScriptPath,
    [string]$WorkingDirectory
  )

  Start-Process -FilePath 'powershell.exe' `
    -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $ScriptPath `
    -WorkingDirectory $WorkingDirectory `
    -WindowStyle Hidden | Out-Null
}

Write-Host 'Starting project-local MySQL...'
powershell -NoProfile -ExecutionPolicy Bypass -File $mysqlScript | Out-Host

if (-not (Wait-ForMysql)) {
  throw 'MySQL did not become ready on 127.0.0.1:3307.'
}

if (-not (Test-TcpPort -HostName '127.0.0.1' -Port 5000)) {
  Write-Host 'Launching backend...'
  Start-BackgroundScript -ScriptPath $backendScript -WorkingDirectory $backendDir
} else {
  Write-Host 'Backend already appears to be running on port 5000.'
}

if (-not (Wait-ForBackend)) {
  Write-Host 'Retrying backend launch...'
  Start-BackgroundScript -ScriptPath $backendScript -WorkingDirectory $backendDir
  if (-not (Wait-ForBackend)) {
    throw 'Backend did not become ready on http://localhost:5000.'
  }
}

if (-not (Test-TcpPort -HostName '127.0.0.1' -Port 5173) -and -not (Test-TcpPort -HostName '::1' -Port 5173)) {
  Write-Host 'Launching frontend...'
  Start-BackgroundScript -ScriptPath $frontendScript -WorkingDirectory $frontendDir
} else {
  Write-Host 'Frontend already appears to be running on port 5173.'
}

if (-not (Wait-ForFrontend)) {
  throw 'Frontend did not become ready on http://localhost:5173.'
}

Write-Host ''
Write-Host 'Project is running.'
Write-Host 'Frontend: http://localhost:5173'
Write-Host 'Backend:  http://localhost:5000/api/health'
Write-Host 'Demo login: admin@thapar.edu / password123'
