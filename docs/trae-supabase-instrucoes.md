# Conectando o Supabase ao TRAE

## Configuração Direta no TRAE

Para conectar o Supabase diretamente no TRAE, siga estas instruções:

### 1. Configuração no TRAE

Quando estiver usando o TRAE e precisar conectar ao Supabase, você pode usar o seguinte comando no terminal do TRAE:

```
npx --yes vite --host --port 3000
```

Em seguida, no TRAE, você pode usar a conexão direta ao Supabase usando a string de conexão:

```
postgresql://postgres.iilbczoanafeqzjqovjb:El%401nem%40e@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

### 2. Usando o Supabase no Código

Para usar o Supabase no seu código através do TRAE, você pode criar um arquivo de cliente Supabase:

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iilbczoanafeqzjqovjb.supabase.co';
const supabaseKey = 'sbp_5bb4b8be35d5bebe8502a129e1a80f1f9a2c7125';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

Depois, você pode importar e usar este cliente em qualquer parte do seu código:

```typescript
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

### 3. Configuração de Variáveis de Ambiente

Para maior segurança, você pode configurar as credenciais do Supabase como variáveis de ambiente no TRAE:

1. No TRAE, você pode definir variáveis de ambiente diretamente no terminal:

```
$env:SUPABASE_URL = "https://iilbczoanafeqzjqovjb.supabase.co"
$env:SUPABASE_KEY = "sbp_5bb4b8be35d5bebe8502a129e1a80f1f9a2c7125"
```

2. Ou criar um arquivo `.env` na raiz do projeto:

```
VITE_SUPABASE_URL=https://iilbczoanafeqzjqovjb.supabase.co
VITE_SUPABASE_KEY=sbp_5bb4b8be35d5bebe8502a129e1a80f1f9a2c7125
```

### 4. Testando a Conexão no TRAE

Para testar se a conexão está funcionando corretamente no TRAE, você pode executar o seguinte código:

```typescript
import { supabase } from '@/integrations/supabase/client';

const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count');
    if (error) throw error;
    console.log('Conexão bem-sucedida! Total de perfis:', data);
    return true;
  } catch (err) {
    console.error('Erro na conexão com Supabase:', err);
    return false;
  }
};

testConnection();
```

## Observações Importantes

1. A senha do banco de dados contém caracteres especiais (`@`), então é importante codificá-la corretamente na URL de conexão.
2. O token de acesso do Supabase (`sbp_5bb4b8be35d5bebe8502a129e1a80f1f9a2c7125`) deve ser mantido seguro e não compartilhado.
3. Para maior segurança, considere usar variáveis de ambiente para armazenar as credenciais.
4. Se você encontrar problemas de conexão, verifique se o SSL está habilitado e se as credenciais estão corretas.

## Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do TRAE](https://trae.ai/docs)
- [Guia de Integração do Supabase com React](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)