
# Script de inicialização da aplicação Keeper of Realms
# Este script configura e inicia o servidor de desenvolvimento Vite
# com as configurações corretas para garantir que todas as rotas funcionem

Write-Host "Iniciando Keeper of Realms..." -ForegroundColor Cyan

# Verificar se o Node.js está instalado
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Erro: Node.js não encontrado. Por favor, instale o Node.js para continuar." -ForegroundColor Red
    exit 1
}

# Verificar se as dependências estão instaladas
if (-not (Test-Path -Path "node_modules")) {
    Write-Host "Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# Limpar cache do navegador (opcional)
Write-Host "Dica: Se encontrar problemas, tente limpar o cache do seu navegador." -ForegroundColor Yellow

# Configurar variáveis de ambiente para garantir que o historyApiFallback funcione
$env:VITE_HISTORY_FALLBACK = "true"

# Iniciar o servidor de desenvolvimento
Write-Host "Iniciando servidor de desenvolvimento..." -ForegroundColor Green
Write-Host "Acesse a aplicação em: http://localhost:3000/" -ForegroundColor Cyan
Write-Host "IMPORTANTE: Sempre acesse a aplicação pela URL base (http://localhost:3000/) e não pelos arquivos HTML estáticos." -ForegroundColor Yellow

# Iniciar o servidor Vite
npm run dev