document.addEventListener('DOMContentLoaded', function() {
    // Carrega os scripts necessários para os componentes
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback || function() {};
        document.head.appendChild(script);
    }

    // Carrega os estilos necessários
    function loadStyle(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    // Carrega Font Awesome se ainda não estiver carregado
    if (!document.querySelector('link[href*="font-awesome"]')) {
        loadStyle('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
    }

    // Carrega a fonte MedievalSharp se ainda não estiver carregada
    if (!document.querySelector('link[href*="MedievalSharp"]')) {
        loadStyle('https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap');
    }

    // Carrega os estilos dos componentes
    loadStyle('./topbar.css');
    loadStyle('./sidebar_static.css');
    loadStyle('./layout-adjustments.css');

    // Carrega a barra superior
    fetch('./topbar.html')
        .then(response => response.text())
        .then(html => {
            // Cria um container temporário
            const temp = document.createElement('div');
            temp.innerHTML = html;
            
            // Insere a barra superior no início do body
            const topBar = temp.firstElementChild;
            document.body.insertBefore(topBar, document.body.firstChild);
            
            // Executa os scripts dentro do HTML carregado
            const scripts = temp.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                    newScript.src = script.src;
                } else {
                    newScript.textContent = script.textContent;
                }
                document.body.appendChild(newScript);
            });

            // Depois de carregar a barra superior, carrega a barra lateral
            createSidebar();
        })
        .catch(error => {
            console.error('Erro ao carregar a barra superior:', error);
            // Se falhar ao carregar a barra superior, tenta carregar a barra lateral mesmo assim
            createSidebar();
        });

    // Função para criar a barra lateral
    function createSidebar() {
        // Verifica se a página atual é a página inicial
        const currentPage = window.location.pathname.split('/').pop() || 'home_static.html';
        const isHomePage = currentPage === 'home_static.html' || currentPage === 'home.html' || currentPage === 'index.html';
        
        // Se for a página inicial, não carrega a barra lateral
        if (isHomePage) {
            console.log('Página inicial detectada. Barra lateral não será exibida.');
            return;
        }
        
        // Cria a estrutura da barra lateral
        const sidebar = document.createElement('div');
        sidebar.className = 'sidebar';
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <h3>Keeper of Realms</h3>
            </div>
            <nav class="sidebar-nav">
                <a href="home_static.html"><i class="fas fa-home"></i> Home</a>
                <a href="mesas.html"><i class="fas fa-table-cells"></i> Mesas</a>
                <a href="missoes.html"><i class="fas fa-scroll"></i> Missões</a>
                <a href="inventario.html"><i class="fas fa-briefcase"></i> Inventário</a>
                <a href="loja.html"><i class="fas fa-store"></i> Loja</a>
                <a href="creations_static.html"><i class="fas fa-magic"></i> Criações</a>
            </nav>
        `;
        
        // Insere a barra lateral após a barra superior
        const topBar = document.querySelector('.top-bar');
        if (topBar) {
            document.body.insertBefore(sidebar, topBar.nextSibling);
        } else {
            document.body.insertBefore(sidebar, document.body.firstChild);
        }
        
        // Adiciona classe ao body para ajustar o conteúdo principal
        document.body.classList.add('with-sidebar');
        
        // Adiciona classe ao container principal para ajustar o layout
        const pageContainer = document.querySelector('.page-container');
        if (pageContainer) {
            pageContainer.classList.add('with-sidebar');
        }

        // Carrega o gerenciador de layout para interações entre os componentes
        loadScript('./layout-manager.js');

        // Atualiza a classe 'active' no item de menu atual com base na URL
        updateActiveMenuItem();
    }

    // Função para atualizar o item de menu ativo
    function updateActiveMenuItem() {
        const currentPage = window.location.pathname.split('/').pop() || 'home_static.html';
        setTimeout(() => {
            const menuItems = document.querySelectorAll('.sidebar-nav a');
            
            menuItems.forEach(item => {
                const itemHref = item.getAttribute('href');
                if (itemHref === currentPage) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }, 100); // Pequeno atraso para garantir que os elementos estejam disponíveis
    }
});