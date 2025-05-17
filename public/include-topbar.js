// Script para incluir a barra superior em todas as páginas HTML
document.addEventListener('DOMContentLoaded', function() {
    // Carrega o CSS da barra superior
    const topbarCss = document.createElement('link');
    topbarCss.rel = 'stylesheet';
    topbarCss.href = './topbar.css';
    document.head.appendChild(topbarCss);
    
    // Carrega o HTML da barra superior
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
        })
        .catch(error => console.error('Erro ao carregar a barra superior:', error));
});