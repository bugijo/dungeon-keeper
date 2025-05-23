// Servidor Express personalizado para servir a aplicação React
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Obtém o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do servidor
const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos da pasta dist (após build) ou public (durante desenvolvimento)
const staticDir = fs.existsSync(resolve(__dirname, 'dist')) ? 'dist' : 'public';
app.use(express.static(resolve(__dirname, staticDir)));

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rota para verificar status do servidor
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', time: new Date().toISOString() });
});

// Importante: Redirecionar todas as requisições para o index.html
// Isso permite que o React Router lide com as rotas no lado do cliente
app.get('*', (req, res) => {
  // Se a requisição for para um arquivo HTML específico na pasta public, servir esse arquivo
  if (req.url.endsWith('.html') && fs.existsSync(resolve(__dirname, 'public', req.url.substring(1)))) {
    return res.sendFile(resolve(__dirname, 'public', req.url.substring(1)));
  }
  
  // Caso contrário, servir o index.html principal para que o React Router funcione
  res.sendFile(resolve(__dirname, staticDir, 'index.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📁 Servindo arquivos da pasta: ${staticDir}`);
  console.log(`🔄 Todas as rotas serão redirecionadas para index.html (exceto arquivos estáticos)`);
  console.log(`💡 Pressione Ctrl+C para encerrar o servidor\n`);
});