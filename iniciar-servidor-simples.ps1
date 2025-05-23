# Script PowerShell para iniciar o servidor

Write-Host "Iniciando o servidor do Keeper of Realms Forge..." -ForegroundColor Cyan

# Verifica se o Node.js esta instalado
try {
    $nodeVersion = node -v
    Write-Host "Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js nao encontrado. Por favor, instale o Node.js para continuar." -ForegroundColor Red
    exit 1
}

# Verifica se as dependencias estao instaladas
if (-not (Test-Path -Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Falha ao instalar dependencias. Verifique os erros acima." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Dependencias instaladas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Dependencias ja instaladas" -ForegroundColor Green
}

# Inicia o servidor de desenvolvimento
Write-Host "Iniciando o servidor de desenvolvimento..." -ForegroundColor Cyan
Write-Host "O navegador sera aberto automaticamente em http://localhost:3000" -ForegroundColor Yellow
Write-Host "IMPORTANTE: Use a URL base (http://localhost:3000/) para acessar a aplicacao React completa" -ForegroundColor Magenta

# Inicia o servidor Vite
npm run dev

# Se o servidor Vite falhar, tenta iniciar o servidor Express personalizado
if ($LASTEXITCODE -ne 0) {
    Write-Host "O servidor Vite falhou. Tentando iniciar o servidor Express personalizado..." -ForegroundColor Yellow
    node server.js
}