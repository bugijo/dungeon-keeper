# Script para upload do projeto Dungeon Kreeper para o GitHub
# Configurado especificamente para o repositório: https://github.com/bugijo/Dungeon-Kreeper.git

# Verifica se o Git está instalado
$gitInstalled = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitInstalled) {
    Write-Host "Erro: Git não encontrado. Por favor, instale o Git antes de continuar." -ForegroundColor Red
    exit 1
}

# Configura as credenciais do Git (apenas para este script, opcional se já configurado globalmente)
# git config user.name "bugijo" # Descomente se necessário
# git config user.email "gil.jonathan.pereira@gmail.com" # Descomente se necessário

# Define a URL do repositório SEM o token de acesso
$repoUrl = "https://github.com/bugijo/Dungeon-Kreeper.git"

# Verifica se já existe um repositório Git inicializado
if (-not (Test-Path -Path ".git")) {
    Write-Host "Inicializando repositório Git..." -ForegroundColor Yellow
    git init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao inicializar o repositório Git." -ForegroundColor Red
        exit 1
    }
}

# Remove qualquer remote existente chamado 'origin' para evitar conflitos
$remoteExists = git remote -v | Select-String "origin"
if ($remoteExists) {
    Write-Host "Removendo configuração remota anterior 'origin'..." -ForegroundColor Yellow
    git remote remove origin
}

# Adiciona o novo remote
Write-Host "Configurando repositório remoto 'origin' para $repoUrl..." -ForegroundColor Yellow
git remote add origin $repoUrl
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao configurar o repositório remoto." -ForegroundColor Red
    exit 1
}

# Adiciona todos os arquivos ao staging
Write-Host "Adicionando arquivos ao staging..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao adicionar arquivos ao staging." -ForegroundColor Red
    exit 1
}

# Solicita mensagem de commit
$commitMessage = Read-Host "Digite a mensagem para o commit (ex: 'Versão inicial do Dungeon Kreeper')"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Atualização do projeto Dungeon Kreeper"
}

# Realiza o commit
Write-Host "Realizando commit..." -ForegroundColor Yellow
git commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao realizar o commit. Se o erro for 'nothing to commit', pode ser que o commit anterior já inclua estas mudanças após um --amend." -ForegroundColor Yellow
    # Não sair se for 'nothing to commit' e estamos tentando corrigir um commit anterior.
}

# Tenta fazer push para o branch master
Write-Host "Enviando código para o GitHub (branch master)..." -ForegroundColor Yellow
# Git solicitará credenciais (usuário e token) se necessário
git push -f origin master 
if ($LASTEXITCODE -ne 0) {
    # Se falhar, tenta com o branch main (menos provável no seu caso, mas como fallback)
    Write-Host "Falha ao enviar para master. Tentando enviar para o branch main..." -ForegroundColor Yellow
    git push -f origin main
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "\nErro ao enviar o código para o GitHub." -ForegroundColor Red
        Write-Host "Verifique suas credenciais, permissões do repositório e a conexão com a internet." -ForegroundColor Yellow
        Write-Host "Pode ser necessário autenticar-se novamente. Use seu nome de usuário GitHub e o token como senha." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "\nCódigo enviado com sucesso para o GitHub!" -ForegroundColor Green
Write-Host "Repositório: https://github.com/bugijo/Dungeon-Kreeper" -ForegroundColor Cyan

Write-Host "\nPressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")