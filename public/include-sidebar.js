document.addEventListener('DOMContentLoaded', function() {
    // Carrega o CSS da barra lateral
    const sidebarCss = document.createElement('link');
    sidebarCss.rel = 'stylesheet';
    sidebarCss.href = './sidebar_static.css';
    document.head.appendChild(sidebarCss);
    
    // Cria a estrutura da barra lateral
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
        <div class="sidebar-header">
            <h3>Keeper of Realms</h3>
        </div>
        <nav class="sidebar-nav">
            <a href="home_static.html" class="active"><i class="fas fa-home"></i> Home</a>
            <a href="mesas.html"><i class="fas fa-table-cells"></i> Mesas</a>
            <a href="missoes.html"><i class="fas fa-scroll"></i> Missões</a>
            <a href="inventario.html"><i class="fas fa-briefcase"></i> Inventário</a>
            <a href="loja.html"><i class="fas fa-store"></i> Loja</a>
            <a href="creations_static.html"><i class="fas fa-magic"></i> Criações</a>
        </nav>
    `;
    
    // Insere a barra lateral no início do body, após a barra superior (se existir)
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
});