# Script para facilitar o upload do projeto para o GitHub

# Instruções de uso:
# 1. Substitua USER pelo seu nome de usuário do GitHub
# 2. Substitua REPO pelo nome do repositório que você criou
# 3. Execute este script no PowerShell

# Configurações
$usuario = "SEU_USUARIO_GITHUB"
$repositorio = "dungeon-kreeper"

# Exibir informações iniciais
Write-Host "=== Script de Upload para GitHub - Dungeon Kreeper ===" -ForegroundColor Cyan
Write-Host "Progresso atual do projeto: 95% concluído" -ForegroundColor Green
Write-Host ""

# Verificar se o repositório Git está inicializado
if (-not (Test-Path -Path ".git")) {
    Write-Host "Inicializando repositório Git..." -ForegroundColor Yellow
    git init
}

# Verificar status atual
Write-Host "Status atual do repositório:" -ForegroundColor Yellow
git status

# Perguntar se deseja continuar
$continuar = Read-Host "Deseja continuar com o upload para o GitHub? (S/N)"
if ($continuar -ne "S" -and $continuar -ne "s") {
    Write-Host "Operação cancelada pelo usuário." -ForegroundColor Red
    exit
}

# Solicitar credenciais do GitHub
Write-Host "\nPor favor, configure o repositório remoto:" -ForegroundColor Yellow
$usuario = Read-Host "Digite seu nome de usuário do GitHub"
$repositorio = Read-Host "Digite o nome do repositório criado no GitHub"

# Configurar o repositório remoto
Write-Host "\nConfigurando repositório remoto..." -ForegroundColor Yellow
git remote add origin "https://github.com/$usuario/$repositorio.git"

# Verificar configuração do remote
Write-Host "\nVerificando configuração do repositório remoto:" -ForegroundColor Yellow
git remote -v

# Adicionar todos os arquivos (caso ainda não tenha feito)
Write-Host "\nAdicionando arquivos ao commit..." -ForegroundColor Yellow
git add .

# Verificar se há alterações para commit
$status = git status --porcelain
if ($status) {
    # Criar commit
    Write-Host "\nCriando commit..." -ForegroundColor Yellow
    git commit -m "Upload inicial do projeto Dungeon Kreeper - 95% concluído"
}

# Enviar para o GitHub
Write-Host "\nEnviando para o GitHub..." -ForegroundColor Yellow
git push -u origin master

# Verificar resultado
if ($LASTEXITCODE -eq 0) {
    Write-Host "\n✅ Upload concluído com sucesso!" -ForegroundColor Green
    Write-Host "Acesse seu repositório em: https://github.com/$usuario/$repositorio" -ForegroundColor Cyan
    Write-Host "\nPróximos passos:" -ForegroundColor Yellow
    Write-Host "1. Implementar integração com IA para geração de conteúdo" -ForegroundColor White
    Write-Host "2. Realizar testes de validação da experiência do usuário" -ForegroundColor White
    Write-Host "3. Finalizar os 5% restantes do projeto" -ForegroundColor White
} else {
    Write-Host "\n❌ Ocorreu um erro durante o upload." -ForegroundColor Red
    Write-Host "Verifique as mensagens de erro acima e tente novamente." -ForegroundColor Red
}