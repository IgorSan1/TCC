(function(){
    const API_BASE = "http://localhost:8080/api/v1";

    // Função para decodificar o token JWT e extrair informações
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

    // Função para formatar CPF
    function formatarCpf(cpf) {
        if (!cpf) return "";
        const digits = cpf.replace(/\D/g, "");
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    // Função para formatar telefone
    function formatarTelefone(telefone) {
        if (!telefone) return "";
        const digits = telefone.replace(/\D/g, "");
        if (digits.length === 11) {
            return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        } else if (digits.length === 10) {
            return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
        }
        return telefone;
    }

    // Função para formatar data de yyyy-MM-dd para dd/MM/yyyy
    function formatarData(data) {
        if (!data) return "";
        
        // Se já estiver no formato dd/MM/yyyy
        if (data.includes('/')) {
            return data;
        }
        
        // Se estiver no formato ISO (yyyy-MM-dd ou timestamp)
        if (data.includes('-')) {
            const [ano, mes, dia] = data.split("-");
            return `${dia}/${mes}/${ano}`;
        }
        
        // Tentar converter timestamp
        try {
            const date = new Date(data);
            const dia = String(date.getDate()).padStart(2, '0');
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const ano = date.getFullYear();
            return `${dia}/${mes}/${ano}`;
        } catch (e) {
            return data;
        }
    }

    // Função para formatar o cargo
    function formatarCargo(cargo) {
        if (!cargo) return "";
        
        const cargos = {
            'TECNICO': 'Técnico',
            'ENFERMEIRO': 'Enfermeiro',
            'TECNICO_DE_ENFERMAGEM': 'Técnico de Enfermagem'
        };
        
        return cargos[cargo] || cargo;
    }

    // Função para formatar roles
    function formatarRoles(roles) {
        if (!roles) return "";
        
        if (Array.isArray(roles)) {
            return roles.map(role => {
                if (role === 'ADMIN') return 'Administrador';
                if (role === 'USER') return 'Usuário';
                return role;
            }).join(', ');
        }
        
        if (roles === 'ADMIN') return 'Administrador';
        if (roles === 'USER') return 'Usuário';
        return roles;
    }

    async function carregarPerfilUsuario() {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Você precisa estar logado para acessar o perfil.");
            window.location.href = "login.html";
            return;
        }

        // Decodificar o token para obter o username
        const decodedToken = decodeJWT(token);
        const username = decodedToken?.sub;
        
        if (!username) {
            alert("Token inválido. Faça login novamente.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        console.log("👤 Usuário logado:", username);

        try {
            // Buscar todos os usuários e filtrar pelo username
            const resp = await fetch(`${API_BASE}/usuario?size=1000&page=0`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!resp.ok) {
                console.error("Erro ao carregar perfil:", resp.status);
                
                // Se não conseguir buscar na lista, tentar buscar dados do token
                preencherPerfilDoToken(decodedToken);
                return;
            }

            const data = await resp.json().catch(() => ({}));
            console.log("📦 Dados recebidos:", data);

            // Normalizar resposta
            let usuarios = [];
            if (Array.isArray(data?.dados) && Array.isArray(data.dados[0])) {
                usuarios = data.dados[0];
            } else if (Array.isArray(data?.dados)) {
                usuarios = data.dados;
            }

            // Procurar o usuário pelo username
            const usuario = usuarios.find(u => u.usuario === username);

            if (usuario) {
                console.log("✅ Usuário encontrado:", usuario);
                preencherPerfil(usuario);
            } else {
                console.warn("⚠️ Usuário não encontrado na lista");
                preencherPerfilDoToken(decodedToken);
            }
        } catch (err) {
            console.error("❌ Erro ao carregar perfil:", err);
            
            // Fallback: usar dados do token
            preencherPerfilDoToken(decodedToken);
        }
    }

    function preencherPerfilDoToken(decodedToken) {
        console.log("📝 Preenchendo perfil a partir do token");
        
        // Atualizar nome na header
        const headerUserSpan = document.querySelector(".user-profile span");
        if (headerUserSpan) {
            headerUserSpan.textContent = decodedToken.sub || "Usuário";
        }

        // Preencher com informações básicas do token
        const inputUsuario = document.querySelector('input[value="admin"]');
        if (inputUsuario) {
            inputUsuario.value = decodedToken.sub || "";
        }

        // Adicionar mensagem informativa
        const profileCard = document.querySelector('.profile-card');
        if (profileCard) {
            const aviso = document.createElement('div');
            aviso.style.cssText = 'padding: 1rem; background-color: #fff9e6; border-left: 4px solid #ffc107; margin-bottom: 1.5rem; border-radius: 8px;';
            aviso.innerHTML = `
                <p style="margin: 0; color: #856404;">
                    <strong>⚠️ Informações limitadas:</strong> Não foi possível carregar todos os dados do perfil. 
                    Entre em contato com o administrador se precisar atualizar suas informações.
                </p>
            `;
            profileCard.insertBefore(aviso, profileCard.firstChild);
        }
    }

    function preencherPerfil(usuario) {
        console.log("📝 Preenchendo perfil completo");
        
        // Atualizar nome na header
        const headerUserSpan = document.querySelector(".user-profile span");
        if (headerUserSpan) {
            headerUserSpan.textContent = usuario.usuario || "Usuário";
        }

        // Criar mapeamento de valores
        const valores = {
            usuario: usuario.usuario || "",
            cpf: formatarCpf(usuario.cpf) || "",
            dataNascimento: formatarData(usuario.dataNascimento) || "",
            nomeCompleto: usuario.nomeCompleto || "",
            email: usuario.email || "",
            telefone: formatarTelefone(usuario.telefone) || "",
            cargo: formatarCargo(usuario.cargo) || "",
            cns: usuario.cns || "",
            unidadeSaude: usuario.unidadeSaude || "",
        };

        console.log("✅ Valores para preencher:", valores);

        // Preencher campos por label
        const formGroups = document.querySelectorAll(".form-group");
        
        formGroups.forEach(group => {
            const label = group.querySelector("label");
            const input = group.querySelector("input");
            
            if (!label || !input) return;
            
            const labelText = label.textContent.trim();
            
            // Mapear labels para valores
            switch(labelText) {
                case "Usuário:":
                    input.value = valores.usuario;
                    break;
                case "CPF:":
                    input.value = valores.cpf;
                    break;
                case "Data de nascimento:":
                    input.value = valores.dataNascimento;
                    break;
                case "Nome completo:":
                    input.value = valores.nomeCompleto;
                    break;
                case "E-mail:":
                    input.value = valores.email;
                    break;
                case "Telefone:":
                    input.value = valores.telefone;
                    break;
                case "Cargo:":
                    input.value = valores.cargo;
                    break;
            }
        });
    }

    // Adicionar funcionalidade ao botão de editar
    const btnEditar = document.querySelector('.profile-header .btn-secondary');
    if (btnEditar) {
        btnEditar.addEventListener('click', () => {
            alert('Funcionalidade de edição em desenvolvimento.\n\nPara alterar seus dados, entre em contato com o administrador do sistema.');
        });
    }

    // Carregar perfil ao inicializar a página
    carregarPerfilUsuario();
})();
