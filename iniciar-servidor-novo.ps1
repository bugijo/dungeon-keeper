# Script PowerShell para iniciar o servidor melhorado

Write-Host "`n🚀 Iniciando o servidor melhorado do Keeper of Realms Forge...`n" -ForegroundColor Cyan

# Verifica se o Node.js está instalado
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Por favor, instale o Node.js para continuar." -ForegroundColor Red
    exit 1
}

# Verifica se as dependências estão instaladas
if (-not (Test-Path -Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Falha ao instalar dependências. Verifique os erros acima." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "✅ Dependências já instaladas" -ForegroundColor Green
}

# Inicia o servidor de desenvolvimento
Write-Host "`n🌐 Iniciando o servidor de desenvolvimento...`n" -ForegroundColor Cyan
Write-Host "💡 O navegador será aberto automaticamente em http://localhost:3000`n" -ForegroundColor Yellow
Write-Host "⚠️ IMPORTANTE: Use a URL base (http://localhost:3000/) para acessar a aplicação React completa`n" -ForegroundColor Magenta

# Inicia o servidor Vite
npm run dev

# Se o servidor Vite falhar, tenta iniciar o servidor Express personalizado
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️ O servidor Vite falhou. Tentando iniciar o servidor Express personalizado...`n" -ForegroundColor Yellow
    node server.js
}