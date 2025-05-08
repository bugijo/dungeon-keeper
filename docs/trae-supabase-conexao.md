# Conectando o Supabase ao TRAE

## Informações de Conexão do Supabase

Aqui estão as informações de conexão do seu banco de dados Supabase:

```
Host: aws-0-sa-east-1.pooler.supabase.com
Porta: 6543
Usuário: postgres.iilbczoanafeqzjqovjb
Senha: El@1nem@e
Banco de Dados: postgres
SSL: Habilitado
Token de Acesso: sbp_5bb4b8be35d5bebe8502a129e1a80f1f9a2c7125
```

## Como Conectar no TRAE

Para conectar ao Supabase no ambiente TRAE, você pode usar uma das seguintes abordagens:

### 1. Conexão Direta via URL

Quando o TRAE solicitar uma URL de conexão, você pode fornecer a string de conexão PostgreSQL completa:

```
postgresql://postgres.iilbczoanafeqzjqovjb:El@1nem@e@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

**Observação**: Se a conexão falhar devido a caracteres especiais na senha, você pode precisar codificar a senha na URL. Nesse caso, a URL seria:

```
postgresql://postgres.iilbczoanafeqzjqovjb:El%401nem%40e@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

### 2. Conexão via Parâmetros Individuais

Se o TRAE solicitar os parâmetros de conexão separadamente, forneça:

- **Host**: aws-0-sa-east-1.pooler.supabase.com
- **Porta**: 6543
- **Usuário**: postgres.iilbczoanafeqzjqovjb
- **Senha**: El@1nem@e
- **Banco de Dados**: postgres
- **SSL**: Habilitado/Sim

### 3. Usando o Token de Acesso do Supabase

Se o TRAE solicitar um token de acesso do Supabase em vez de credenciais de banco de dados, use:

```
sbp_5bb4b8be35d5bebe8502a129e1a80f1f9a2c7125
```

## Verificando a Conexão

Para verificar se a conexão está funcionando corretamente no TRAE:

1. Tente executar uma consulta simples como `SELECT NOW();`
2. Verifique se você consegue visualizar as tabelas existentes no banco de dados
3. Se houver erros de conexão, verifique se as credenciais estão corretas e se o SSL está habilitado

## Solução de Problemas

Se você encontrar problemas ao conectar:

1. **Erro de SSL**: Certifique-se de que a conexão SSL está habilitada
2. **Erro de Autenticação**: Verifique se o usuário e senha estão corretos
3. **Erro de Conexão**: Verifique se o host e a porta estão corretos e se o banco de dados Supabase está acessível
4. **Caracteres Especiais**: Se a senha contém caracteres especiais (@), tente codificar a URL ou usar aspas duplas ao redor da senha

## Integrando no Código

Se você estiver integrando o Supabase diretamente no código do seu projeto, pode usar o cliente Supabase conforme mostrado no arquivo de desenvolvimento:

```tsx
import { supabase } from '@/integrations/supabase/client';

const fetchData = async () => {
  try {
    const { data, error } = await supabase
      .from('sua_tabela')
      .select('*');
      
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Erro:', err);
    return null;
  }
};
```

Lembre-se de configurar o cliente Supabase com as credenciais corretas no arquivo de configuração do projeto.