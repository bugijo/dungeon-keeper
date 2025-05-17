document.addEventListener('DOMContentLoaded', function() {
    // Carrega os estilos de ajuste de layout
    const layoutCss = document.createElement('link');
    layoutCss.rel = 'stylesheet';
    layoutCss.href = './layout-adjustments.css';
    document.head.appendChild(layoutCss);
    
    // Verifica se o menu hamburger existe
    const menuHamburger = document.querySelector('.menu-hamburger');
    if (menuHamburger) {
        // Adiciona evento de clique para mostrar/esconder a sidebar em dispositivos móveis
        menuHamburger.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.toggle('active');
                this.classList.toggle('active');
            }
        });
    }
    
    // Detecta o tamanho da tela e ajusta a visibilidade da sidebar
    function adjustSidebarVisibility() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active'); // Esconde a sidebar em telas pequenas por padrão
            } else {
                sidebar.classList.add('active'); // Mostra a sidebar em telas maiores
            }
        }
    }
    
    // Ajusta a visibilidade inicial
    adjustSidebarVisibility();
    
    // Adiciona evento de redimensionamento da janela
    window.addEventListener('resize', adjustSidebarVisibility);
    
    // Atualiza a classe 'active' no item de menu atual com base na URL
    function updateActiveMenuItem() {
        const currentPage = window.location.pathname.split('/').pop() || 'home_static.html';
        const menuItems = document.querySelectorAll('.sidebar-nav a');
        
        menuItems.forEach(item => {
            const itemHref = item.getAttribute('href');
            if (itemHref === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    // Atualiza o item de menu ativo
    updateActiveMenuItem();
});