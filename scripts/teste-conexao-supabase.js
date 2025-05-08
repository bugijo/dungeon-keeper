// Arquivo para testar a conexão com o Supabase
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://iilbczoanafeqzjqovjb.supabase.co';
const supabaseKey = 'sbp_5bb4b8be35d5bebe8502a129e1a80f1f9a2c7125';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para testar a conexão
async function testarConexao() {
  try {
    console.log('Testando conexão com o Supabase...');
    
    // Tentativa de consulta simples
    const { data, error } = await supabase
      .from('profiles')
      .select('count');
      
    if (error) throw error;
    
    console.log('Conexão bem-sucedida!');
    console.log('Dados recebidos:', data);
    
    // Verificar conexão com string de conexão direta
    console.log('\nInformações de conexão direta PostgreSQL:');
    console.log('String de conexão: postgresql://postgres.iilbczoanafeqzjqovjb:El%401nem%40e@aws-0-sa-east-1.pooler.supabase.com:6543/postgres');
    
    // Verificar configuração MCP
    console.log('\nConfiguração MCP existente:');
    console.log(JSON.stringify({
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
    }, null, 2));
    
    return true;
  } catch (err) {
    console.error('Erro na conexão com Supabase:', err);
    return false;
  }
}

// Executar o teste
testarConexao();