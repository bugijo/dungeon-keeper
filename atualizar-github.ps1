# Script para atualizar o repositório GitHub do Dungeon Kreeper

# Verifica se há alterações para commit
$status = git status --porcelain

if ($status) {
    # Pergunta ao usuário a mensagem de commit
    $mensagem = Read-Host "Digite a mensagem para o commit"
    
    # Se o usuário não digitar nada, usa uma mensagem padrão
    if (-not $mensagem) {
        $mensagem = "Atualização do projeto Dungeon Kreeper"
    }
    
    # Adiciona todas as alterações
    git add .
    
    # Faz o commit com a mensagem fornecida
    git commit -m "$mensagem"
    
    # Faz o push para o repositório remoto
    git push -u origin master
    
    Write-Host "\nAlterações enviadas com sucesso para o repositório GitHub!" -ForegroundColor Green
} else {
    Write-Host "\nNão há alterações para enviar ao repositório." -ForegroundColor Yellow
    
    # Pergunta se o usuário deseja fazer push mesmo assim
    $resposta = Read-Host "Deseja fazer push mesmo assim? (s/n)"
    
    if ($resposta -eq "s") {
        git push -u origin master
        Write-Host "\nPush realizado com sucesso!" -ForegroundColor Green
    }
}

Write-Host "\nPressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")