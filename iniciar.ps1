param([switch]$ExpoGo)
$ErrorActionPreference = 'Stop'
$projeto = $PSScriptRoot
$mobile = Join-Path $projeto 'Synple\mobile'
$backend = Join-Path $projeto 'Synple\backend'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Instale Node.js 22.13 ou superior.' }
$nodeVersion = [version]((& node --version).TrimStart('v'))
if ($nodeVersion -lt [version]'22.13.0') { throw 'Este projeto requer Node.js 22.13 ou superior.' }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Instale o Docker Desktop e abra novamente o PowerShell.' }
cmd /c "docker info >nul 2>&1"
if ($LASTEXITCODE -ne 0) {
    $dockerDesktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
    if (-not (Test-Path -LiteralPath $dockerDesktop)) { throw 'Abra o Docker Desktop antes de iniciar.' }
    Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
    $pronto = $false
    for ($tentativa = 0; $tentativa -lt 60; $tentativa++) {
        Start-Sleep -Seconds 2
        cmd /c "docker info >nul 2>&1"
        if ($LASTEXITCODE -eq 0) { $pronto = $true; break }
    }
    if (-not $pronto) { throw 'Docker não iniciou. Confira o Docker Desktop/WSL.' }
}
foreach ($pasta in @($mobile, $backend)) {
    $config = Join-Path $pasta '.env'
    if (-not (Test-Path -LiteralPath $config)) {
        Copy-Item -LiteralPath (Join-Path $pasta '.env.example') -Destination $config
        Write-Warning "Criado $config. Preencha os valores reais de OAuth/SMTP; exemplos não habilitam esses serviços."
    }
}
$pastaTunnel = Join-Path $env:LOCALAPPDATA 'Synple'
$executavelTunnel = Join-Path $pastaTunnel 'cloudflared.exe'
if (-not (Test-Path -LiteralPath $executavelTunnel)) {
    if (-not (Get-Command cloudflared.exe -ErrorAction SilentlyContinue)) {
        New-Item -ItemType Directory -Path $pastaTunnel -Force | Out-Null
        Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile $executavelTunnel
    }
}
docker compose -f (Join-Path $projeto 'docker-compose.yml') up -d --build
if ($LASTEXITCODE -ne 0) { throw 'Falha ao subir banco/API. Confira o erro acima; as portas 5432 e 3001 precisam estar livres.' }
$apiPronta = $false
for ($tentativa = 0; $tentativa -lt 60; $tentativa++) {
    try {
        $health = Invoke-RestMethod -Uri 'http://127.0.0.1:3001/api/health' -TimeoutSec 2
        if ($health.status -eq 'OK') { $apiPronta = $true; break }
    } catch { }
    Start-Sleep -Seconds 2
}
if (-not $apiPronta) { throw 'A API não ficou disponível. Execute docker compose logs backend.' }
# Carrega somente dados fictícios em uma instalação sem usuários.
docker compose -f (Join-Path $projeto 'docker-compose.yml') exec -T backend node src/db/init-db.js --if-empty
if ($LASTEXITCODE -ne 0) { throw 'Falha ao preparar os dados de demonstração. Confira os logs; o aplicativo não será iniciado.' }
Push-Location -LiteralPath $mobile
try {
    npm.cmd install
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar as dependências do aplicativo.' }
    if ($ExpoGo) { npm.cmd run tunnel:go } else { npm.cmd run tunnel }
} finally { Pop-Location }
