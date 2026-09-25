@echo off
chcp 65001 >nul
title Synple - Inicializador Docker

echo ========================================================
echo   🚀 INICIALIZADOR SYNPLE COM DOCKER (CMD)
echo ========================================================
echo.

:: 1. Identifica a pasta do projeto
if exist "%~dp0Synple\docker-compose.yml" (
    cd /d "%~dp0Synple"
) else if exist "%~dp0docker-compose.yml" (
    cd /d "%~dp0"
) else (
    echo [ERRO] Não foi possível localizar o arquivo docker-compose.yml.
    pause
    exit /b 1
)

:: 2. Verifica se o Docker está instalado e em execução
echo [1/4] Verificando Docker Desktop...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ATENÇÃO] O Docker Desktop não está rodando!
    echo Abra o Docker Desktop no Windows e aguarde a inicialização.
    echo Depois pressione qualquer tecla para tentar novamente...
    pause >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERRO] Docker ainda não disponível. Abortando.
        pause
        exit /b 1
    )
)
echo [OK] Docker conectado com sucesso.

:: 3. Tenta liberar a porta 5432 se o serviço local do Postgres estiver rodando
echo.
echo [2/4] Verificando possíveis conflitos na porta 5432...
net stop postgresql-x64-18 >nul 2>&1
net stop postgresql-x64-16 >nul 2>&1

:: 4. Constrói e sobe os containers
echo.
echo [3/4] Construindo e iniciando PostgreSQL e Backend...
docker compose up -d --build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao iniciar os containers do Docker.
    pause
    exit /b 1
)

:: 5. Exibe o status
echo.
echo [4/4] Status dos Containers:
docker compose ps

echo.
echo ========================================================
echo   ✅ SYNPLE BACKEND E POSTGRESQL ESTÃO ONLINE!
echo   📡 API Backend: http://localhost:3001
echo   🗄️  Banco de Dados: PostgreSQL porta 5432
echo ========================================================
echo.
echo Para ver os logs em tempo real, use: docker compose logs -f backend
echo Para parar tudo, use: docker compose down
echo.
pause
