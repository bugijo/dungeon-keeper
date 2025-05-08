# Configuração do Supabase no TRAE

## Arquivo de Configuração MCP

O arquivo `.mcp.json` já foi criado na raiz do projeto com as seguintes configurações:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--host",
        "aws-0-sa-east-1.pooler.supabase.com",
        "--port",
        "6543",
        "--user",
        "postgres.iilbczoanafeqzjqovjb",
        "--password",
        "El@1nem@e",
        "--database",
        "postgres",
        "--ssl",
        "true",
        "--access-token",
        "sbp_5bb4b8be35d5bebe8502a129e1a80f1f9a2c7125"
      ]
    }
  }
}
```

## Como Iniciar o Servidor MCP

Para iniciar o servidor MCP e conectar ao Supabase, execute o seguinte comando no terminal:

```
npx --yes @trae/mcp-cli start
```

## Como Usar no TRAE

No TRAE, você pode acessar o Supabase através do MCP usando a seguinte URL de conexão:

```
mcp://supabase
```

Esta URL deve ser usada nas configurações de conexão do TRAE para acessar o banco de dados Supabase.

## Verificação da Conexão

Para verificar se o servidor MCP está em execução e se a conexão com o Supabase está funcionando corretamente, execute:

```
npx --yes @trae/mcp-cli list
```

Este comando listará todos os servidores MCP em execução, incluindo o servidor Supabase se estiver funcionando corretamente.

## Solução de Problemas

Se você encontrar problemas ao conectar ao Supabase através do MCP, verifique:

1. Se o arquivo `.mcp.json` está na raiz do projeto
2. Se as credenciais do Supabase estão corretas
3. Se o servidor MCP está em execução
4. Se há erros no console ao iniciar o servidor MCP

## Notas Adicionais

- O token de acesso do Supabase (`sbp_5bb4b8be35d5bebe8502a129e1a80f1f9a2c7125`) foi configurado conforme fornecido
- A senha do banco de dados (`El@1nem@e`) foi configurada conforme fornecido
- A conexão está configurada para usar SSL para maior segurança