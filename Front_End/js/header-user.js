(function() {
    console.log("🔄 Iniciando header-user.js...");

    // Função para decodificar o token JWT
    function decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Erro ao decodificar token:", e);
            return null;
        }
    }

    // Função de logout
    function logout() {
        console.log("🚪 Iniciando processo de logout...");
        
        const confirmar = confirm("Deseja realmente sair do sistema?");
        
        if (!confirmar) {
            console.log("❌ Logout cancelado pelo usuário");
            return;
        }

        try {
            // Limpar dados
            localStorage.removeItem("token");
            localStorage.removeItem("pacienteSelecionado");
            sessionStorage.clear();
            
            console.log("✅ Dados limpos, redirecionando...");
            
            // Redirecionar
            window.location.href = "login.html";
            
        } catch (error) {
            console.error("❌ Erro ao fazer logout:", error);
            alert("Erro ao fazer logout. Você será redirecionado para a página de login.");
            window.location.href = "login.html";
        }
    }

    // Função para criar dropdown de usuário
    function criarDropdownUsuario() {
        console.log("🔧 Criando dropdown de usuário...");
        
        const userProfile = document.querySelector(".user-profile");
        
        if (!userProfile) {
            console.warn("⚠️ Elemento .user-profile não encontrado");
            return;
        }

        // Verificar se já existe dropdown
        if (userProfile.querySelector('.user-dropdown')) {
            console.log("ℹ️ Dropdown já existe, pulando criação");
            return;
        }

        // Adicionar indicador de dropdown
        const userSpan = userProfile.querySelector('span');
        if (userSpan) {
            // Criar elemento do indicador
            const indicator = document.createElement('i');
            indicator.className = 'fa-solid fa-chevron-down dropdown-indicator';
            
            // Adicionar depois do span
            userSpan.insertAdjacentElement('afterend', indicator);
            console.log("✅ Indicador de dropdown adicionado");
        }

        // Criar estrutura do dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        dropdown.innerHTML = `
            <a href="perfil.html" class="user-dropdown-item" data-action="navigate">
                <i class="fa-solid fa-user"></i>
                <span>Meu Perfil</span>
            </a>
            <div class="user-dropdown-divider"></div>
            <button type="button" class="user-dropdown-item logout" id="btn-logout-header" data-action="logout">
                <i class="fa-solid fa-right-from-bracket"></i>
                <span>Sair</span>
            </button>
        `;

        // Adicionar dropdown ao DOM
        userProfile.appendChild(dropdown);
        console.log("✅ Dropdown HTML criado");

        userProfile.removeAttribute('href');
        userProfile.style.cursor = 'pointer';

        // Evento de clique no user-profile (apenas para toggle)
        userProfile.addEventListener('click', function(e) {
            // Se clicou em um item do dropdown, não fazer nada aqui
            if (e.target.closest('.user-dropdown-item')) {
                console.log("🎯 Clique em item do dropdown detectado");
                return;
            }
            
            // Se clicou no próprio dropdown (fundo), não fazer nada
            if (e.target.classList.contains('user-dropdown')) {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            const isOpen = dropdown.classList.contains('show');
            dropdown.classList.toggle('show');
            userProfile.classList.toggle('active');
            
            // Animar indicador
            const indicator = userProfile.querySelector('.dropdown-indicator');
            if (indicator) {
                indicator.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
            }
            
            console.log("🔄 Dropdown", isOpen ? "fechado" : "aberto");
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', function(e) {
            if (!userProfile.contains(e.target)) {
                dropdown.classList.remove('show');
                userProfile.classList.remove('active');
                
                const indicator = userProfile.querySelector('.dropdown-indicator');
                if (indicator) {
                    indicator.style.transform = 'rotate(0deg)';
                }
            }
        });

        // Evento no botão de logout
        const btnLogout = document.getElementById('btn-logout-header');
        if (btnLogout) {
            btnLogout.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log("🔴 Botão de logout clicado");
                logout();
            });
            console.log("✅ Evento de logout configurado");
        }

        // Evento no link do perfil
        const linkPerfil = dropdown.querySelector('a[href="perfil.html"]');
        if (linkPerfil) {
            linkPerfil.addEventListener('click', function(e) {
                // Permitir comportamento padrão do link
                e.stopPropagation(); // Apenas impedir que o evento chegue ao user-profile
                console.log("📍 Link do perfil clicado - navegando...");
                // O navegador vai navegar normalmente
            });
            console.log("✅ Link do perfil configurado");
        }

        // Fechar dropdown ao clicar em qualquer item
        const dropdownItems = dropdown.querySelectorAll('.user-dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function() {
                // Fechar dropdown após clicar em qualquer item
                setTimeout(() => {
                    dropdown.classList.remove('show');
                    userProfile.classList.remove('active');
                    const indicator = userProfile.querySelector('.dropdown-indicator');
                    if (indicator) {
                        indicator.style.transform = 'rotate(0deg)';
                    }
                }, 100); // Pequeno delay para permitir navegação
            });
        });
    }

    // Inicialização principal
    function inicializar() {
        console.log("🚀 Inicializando sistema de autenticação...");
        
        // Verificar autenticação
        const token = localStorage.getItem("token");
        
        if (!token) {
            // Se não houver token e não estiver na página de login, redirecionar
            if (!window.location.href.includes('login.html')) {
                console.warn("⚠️ Token não encontrado, redirecionando para login");
                window.location.href = "login.html";
            }
            return;
        }

        // Decodificar token
        const decodedToken = decodeJWT(token);
        const username = decodedToken?.sub;
        const role = decodedToken?.role;

        console.log("👤 Usuário autenticado:", username, "| Role:", role);

        // Atualizar nome do usuário no header
        if (username) {
            const userProfileSpan = document.querySelector(".user-profile span");
            if (userProfileSpan) {
                userProfileSpan.textContent = username;
                console.log("✅ Nome do usuário atualizado no header");
            }

            // Adicionar badge de ADMIN
            if (role === 'ADMIN') {
                const userProfile = document.querySelector(".user-profile");
                if (userProfile && !userProfile.querySelector('.admin-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'admin-badge';
                    badge.style.cssText = `
                        background-color: #dc3545;
                        color: white;
                        font-size: 0.65rem;
                        padding: 0.15rem 0.4rem;
                        border-radius: 10px;
                        margin-left: 0.3rem;
                        font-weight: 700;
                    `;
                    badge.textContent = 'ADMIN';
                    
                    // Adicionar após o span do nome
                    const span = userProfile.querySelector('span');
                    if (span) {
                        span.insertAdjacentElement('afterend', badge);
                    } else {
                        userProfile.appendChild(badge);
                    }
                    console.log("✅ Badge ADMIN adicionado");
                }
            }
        }

        // Criar dropdown
        criarDropdownUsuario();

        // Verificar expiração do token
        const currentTime = Math.floor(Date.now() / 1000);
        if (decodedToken?.exp && decodedToken.exp < currentTime) {
            alert("Sua sessão expirou. Faça login novamente.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
        }

        console.log("✅ Sistema de autenticação inicializado com sucesso");
    }

    // Executar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }

})();