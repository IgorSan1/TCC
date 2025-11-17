(function() {
    'use strict';

    // Função para realizar o logout
    function logout() {
        console.log("🚪 Iniciando processo de logout...");
        
        // Confirmar logout
        const confirmar = confirm("Deseja realmente sair do sistema?");
        
        if (!confirmar) {
            console.log("❌ Logout cancelado pelo usuário");
            return;
        }

        try {
            // Limpar o token do localStorage
            localStorage.removeItem("token");
            console.log("✅ Token removido do localStorage");
            
            // Limpar outros dados temporários se existirem
            localStorage.removeItem("pacienteSelecionado");
            console.log("✅ Dados temporários removidos");
            
            // Limpar sessionStorage também (caso tenha algo)
            sessionStorage.clear();
            console.log("✅ SessionStorage limpo");
            
            // Redirecionar para a página de login
            console.log("🔄 Redirecionando para login...");
            window.location.href = "login.html";
            
        } catch (error) {
            console.error("❌ Erro ao fazer logout:", error);
            alert("Erro ao fazer logout. Você será redirecionado para a página de login.");
            window.location.href = "login.html";
        }
    }

    // Função para criar e adicionar o dropdown de usuário
    function criarDropdownUsuario() {
        const userProfile = document.querySelector(".user-profile");
        
        if (!userProfile) {
            console.warn("⚠️ Elemento .user-profile não encontrado");
            return;
        }

        // Verificar se já existe dropdown
        if (userProfile.querySelector('.user-dropdown')) {
            console.log("ℹ️ Dropdown já existe");
            return;
        }

        // Adicionar indicador de dropdown
        const span = userProfile.querySelector('span');
        if (span && !userProfile.querySelector('.dropdown-indicator')) {
            const indicator = document.createElement('i');
            indicator.className = 'fa-solid fa-chevron-down dropdown-indicator';
            span.appendChild(indicator);
        }

        // Criar estrutura do dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        dropdown.innerHTML = `
            <a href="perfil.html" class="user-dropdown-item">
                <i class="fa-solid fa-user"></i>
                <span>Meu Perfil</span>
            </a>
            <div class="user-dropdown-divider"></div>
            <button class="user-dropdown-item logout" id="btn-logout">
                <i class="fa-solid fa-right-from-bracket"></i>
                <span>Sair</span>
            </button>
        `;

        // Adicionar dropdown ao user-profile
        userProfile.appendChild(dropdown);
        console.log("✅ Dropdown criado com sucesso");

        // Adicionar evento de clique no user-profile
        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('show');
            userProfile.classList.toggle('active');
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', function(e) {
            if (!userProfile.contains(e.target)) {
                dropdown.classList.remove('show');
                userProfile.classList.remove('active');
            }
        });

        // Adicionar evento ao botão de logout
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                logout();
            });
            console.log("✅ Evento de logout configurado");
        }
    }

    // Função para verificar se o usuário está autenticado
    function verificarAutenticacao() {
        const token = localStorage.getItem("token");
        const paginaAtual = window.location.pathname.split('/').pop();
        
        // Se não houver token e não estiver na página de login
        if (!token && paginaAtual !== 'login.html') {
            console.warn("⚠️ Usuário não autenticado - redirecionando para login");
            window.location.href = "login.html";
            return false;
        }
        
        return true;
    }

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (verificarAutenticacao()) {
                criarDropdownUsuario();
            }
        });
    } else {
        if (verificarAutenticacao()) {
            criarDropdownUsuario();
        }
    }

    // Expor função logout globalmente
    window.yaravacLogout = logout;

    console.log("✅ Script de logout inicializado");
})();