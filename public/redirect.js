/**
 * Script de redirecionamento para a aplicação React
 * Este script garante que os usuários que acessam páginas HTML estáticas
 * sejam redirecionados para a aplicação React principal
 * Versão 3.0 - Melhorada com detecção mais robusta e tratamento de erros
 */

// Função para verificar se estamos em uma página HTML estática
function isStaticHtmlPage() {
  return window.location.pathname.endsWith('.html');
}

// Função para verificar se estamos em uma página de diagnóstico (que não deve ser redirecionada)
function isDiagnosticPage() {
  const path = window.location.pathname.toLowerCase();
  return path.includes('diagnostico') || 
         path.includes('redirect-debug') || 
         path.includes('react-diagnostico') || 
         path.includes('404.html');
}

// Função para extrair a rota base da página atual
function extractBaseRoute() {
  const path = window.location.pathname;
  // Remove a extensão .html
  if (path.endsWith('.html')) {
    return path.substring(0, path.length - 5);
  }
  return path;
}

// Mapeamento atualizado de páginas HTML para rotas React específicas
const routeMapping = {
  '/home': '/',
  '/login': '/login',
  '/login-keeper': '/login',
  '/cadastro-keeper': '/register',
  '/cadastro': '/register',
  '/perfil-keeper': '/profile',
  '/perfil': '/profile',
  '/dungeon-keeper': '/tables',
  '/dungeon': '/tables',
  '/inventario-keeper': '/inventory',
  '/inventario': '/inventory',
  '/inventory': '/inventory',
  '/loja-keeper': '/shop',
  '/loja': '/shop',
  '/shop': '/shop',
  '/missoes-keeper': '/missions',
  '/missoes': '/missions',
  '/missions': '/missions',
  '/tables': '/tables'
};

// Função para redirecionar para a aplicação React
function redirectToReactApp() {
  try {
    // Se estamos em uma página HTML estática e não é uma página de diagnóstico
    if (isStaticHtmlPage() && !isDiagnosticPage()) {
      console.log('Redirecionando da página HTML estática para a aplicação React...');
      
      // Extrai a rota base (sem .html)
      const baseRoute = extractBaseRoute();
      console.log('Rota base extraída:', baseRoute);
      
      // Determina a rota de destino usando o mapeamento ou a rota base
      const targetRoute = routeMapping[baseRoute] || baseRoute || '/';
      
      console.log('Redirecionamento iniciado para:', targetRoute);
      
      // Redireciona para a rota correspondente na aplicação React
      window.location.replace(targetRoute);
      
      return true; // Indica que o redirecionamento foi iniciado
    } else if (window.location.pathname === '/index.html') {
      // Caso especial para index.html
      console.log('Redirecionando de index.html para a raiz');
      window.location.replace('/');
      return true;
    } else {
      console.log('Não é necessário redirecionamento: já estamos na aplicação React ou em uma página de diagnóstico');
      return false; // Indica que não houve redirecionamento
    }
  } catch (error) {
    console.error('Erro durante o redirecionamento:', error);
    // Em caso de erro, tenta redirecionar para a raiz como fallback
    try {
      window.location.replace('/');
    } catch (e) {
      console.error('Erro fatal durante redirecionamento de fallback:', e);
    }
    return false;
  }
}

// Executa o redirecionamento quando a página carregar
window.addEventListener('DOMContentLoaded', function() {
  console.log('Verificando necessidade de redirecionamento...');
  console.log('URL atual:', window.location.href);
  console.log('Pathname:', window.location.pathname);
  
  // Pequeno delay para garantir que a página carregou completamente
  setTimeout(redirectToReactApp, 50);
});

// Executa imediatamente também para casos onde o evento DOMContentLoaded já ocorreu
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  console.log('Documento já carregado, verificando redirecionamento imediatamente');
  redirectToReactApp();
}

// Adiciona um manipulador de eventos para o histórico do navegador
window.addEventListener('popstate', function() {
  console.log('Navegação detectada, verificando redirecionamento...');
  redirectToReactApp();
});

// Expõe a função e objetos para uso em páginas de diagnóstico
window.redirectToReactApp = redirectToReactApp;
window.routeMapping = routeMapping;
window.isDiagnosticPage = isDiagnosticPage;