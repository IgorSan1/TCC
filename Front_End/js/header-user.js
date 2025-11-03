(function() {
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

    // Verificar se o usuário está logado
    const token = localStorage.getItem("token");
    
    if (!token) {
        // Se não houver token e não estiver na página de login, redirecionar
        if (!window.location.href.includes('login.html')) {
            window.location.href = "login.html";
        }
        return;
    }

    // Decodificar token e obter username
    const decodedToken = decodeJWT(token);
    const username = decodedToken?.sub;
    const role = decodedToken?.role;

    if (username) {
        // Atualizar o nome do usuário no header
        const userProfileSpan = document.querySelector(".user-profile span");
        if (userProfileSpan) {
            userProfileSpan.textContent = username;
        }

        // Adicionar badge de perfil se for ADMIN
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
                userProfile.appendChild(badge);
            }
        }
    }

    // Adicionar evento de clique no perfil
    const userProfileLink = document.querySelector(".user-profile");
    if (userProfileLink) {
        userProfileLink.style.cursor = 'pointer';
        userProfileLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'perfil.html';
        });
    }

    // Verificar expiração do token
    const currentTime = Math.floor(Date.now() / 1000);
    if (decodedToken?.exp && decodedToken.exp < currentTime) {
        alert("Sua sessão expirou. Faça login novamente.");
        localStorage.removeItem("token");
        window.location.href = "login.html";
    }
})();
