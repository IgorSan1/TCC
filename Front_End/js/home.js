(function(){
    const API_BASE = "http://localhost:8080/api/v1";
    const searchBar = document.querySelector(".search-bar");
    let debounceId;

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

    // Atualizar nome do usuário no header
    function atualizarNomeUsuario() {
        const token = localStorage.getItem("token");
        if (token) {
            const decodedToken = decodeJWT(token);
            const username = decodedToken?.sub;
            const role = decodedToken?.role;

            if (username) {
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
        }
    }

    // Chamar função ao carregar a página
    atualizarNomeUsuario();

    // Verificar se o usuário é ADMIN e exibir botões administrativos
    verificarPermissaoAdmin();

    function verificarPermissaoAdmin() {
        const token = localStorage.getItem("token");
        if (!token) {
            return;
        }

        // Decodificar o token para verificar a role
        const decodedToken = decodeJWT(token);
        const role = decodedToken?.role;

        console.log("🔐 Role do usuário:", role);

        // APENAS se for ADMIN, mostrar os botões administrativos
        const btnCadastroUsuario = document.getElementById("btnCadastroUsuario");
        const btnListarUsuarios = document.getElementById("btnListarUsuarios");
        
        if (role === 'ADMIN') {
            if (btnCadastroUsuario) {
                btnCadastroUsuario.style.display = "";
                console.log("✅ Botão de cadastro de usuário VISÍVEL (ADMIN)");
            }
            if (btnListarUsuarios) {
                btnListarUsuarios.style.display = "";
                console.log("✅ Botão de listar usuários VISÍVEL (ADMIN)");
            }
        } else {
            if (btnCadastroUsuario) {
                btnCadastroUsuario.style.display = "none";
                console.log("🚫 Botão de cadastro de usuário OCULTO (não é ADMIN)");
            }
            if (btnListarUsuarios) {
                btnListarUsuarios.style.display = "none";
                console.log("🚫 Botão de listar usuários OCULTO (não é ADMIN)");
            }
        }
    }

    // Função para aplicar máscara de CPF
    function applyCpfMask(value) {
        const digits = (value || "").replace(/\D/g, "").slice(0, 11);
        const part1 = digits.slice(0, 3);
        const part2 = digits.slice(3, 6);
        const part3 = digits.slice(6, 9);
        const part4 = digits.slice(9, 11);
        let out = part1;
        if (part2) out += `.${part2}`;
        if (part3) out += `.${part3}`;
        if (part4) out += `-${part4}`;
        return out;
    }

    // Função para validar CPF (apenas dígitos)
    function isCpf(value) {
        const digits = (value || "").replace(/\D/g, "");
        return digits.length === 11;
    }

    // Aplicar máscara enquanto digita
    searchBar.addEventListener("input", () => {
        const cursorPos = searchBar.selectionStart;
        const oldValue = searchBar.value;
        const newValue = applyCpfMask(searchBar.value);
        searchBar.value = newValue;
        
        // Ajusta posição do cursor
        if (oldValue.length < newValue.length) {
            searchBar.setSelectionRange(cursorPos + 1, cursorPos + 1);
        }
    });

    // Buscar paciente ao pressionar Enter
    searchBar.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            buscarPaciente();
        }
    });

    // Debounce para busca automática (opcional)
    searchBar.addEventListener("input", () => {
        clearTimeout(debounceId);
        const cpf = searchBar.value;
        
        if (isCpf(cpf)) {
            debounceId = setTimeout(() => {
                buscarPaciente();
            }, 500);
        }
    });

    async function buscarPaciente() {
        const cpf = (searchBar.value || "").replace(/\D/g, "");
        
        if (cpf.length !== 11) {
            alert("⚠️ Informe um CPF válido com 11 dígitos.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            alert("❌ Você precisa estar logado para buscar pacientes.");
            window.location.href = "login.html";
            return;
        }

        // ✅ Adicionar indicador visual de carregamento
        searchBar.disabled = true;
        searchBar.style.opacity = "0.6";
        const originalPlaceholder = searchBar.placeholder;
        searchBar.placeholder = "Buscando...";

        try {
            console.log("🔍 Buscando paciente com CPF:", cpf);
            
            const resp = await fetch(`${API_BASE}/pessoa/buscar-por-cpf`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ cpf: cpf }),
            });

            // ✅ Tratamento melhorado de erros
            if (!resp.ok) {
                if (resp.status === 404) {
                    // Paciente não encontrado ou inativo
                    alert(
                        "⚠️ Paciente não encontrado\n\n" +
                        "Este CPF não está cadastrado no sistema ou o paciente foi removido.\n\n" +
                        "Verifique se o CPF está correto ou cadastre um novo paciente."
                    );
                    console.log("❌ Paciente não encontrado ou inativo para CPF:", cpf);
                } else if (resp.status === 401) {
                    alert("❌ Sessão expirada. Faça login novamente.");
                    localStorage.removeItem("token");
                    window.location.href = "login.html";
                } else {
                    const data = await resp.json().catch(() => ({}));
                    alert(`❌ Erro ao buscar paciente: ${data?.mensagem || 'Erro desconhecido'}`);
                    console.error("Erro na busca:", data);
                }
                return;
            }

            const raw = await resp.json().catch(() => ({}));
            
            let pessoa = null;
            if (Array.isArray(raw?.dados) && Array.isArray(raw.dados[0])) {
                pessoa = raw.dados[0][0];
            } else if (Array.isArray(raw?.dados)) {
                pessoa = raw.dados[0];
            } else if (raw?.dados) {
                pessoa = raw.dados;
            } else {
                pessoa = raw;
            }

            // ✅ Validação adicional: verificar se o paciente está ativo
            if (pessoa && pessoa.uuid) {
                if (pessoa.ativo === false) {
                    alert(
                        "⚠️ Paciente Inativo\n\n" +
                        "Este paciente foi removido do sistema e não pode mais ser acessado.\n\n" +
                        "Entre em contato com um administrador se precisar reativar o cadastro."
                    );
                    console.log("❌ Tentativa de acesso a paciente inativo:", pessoa.nomeCompleto);
                    return;
                }

                console.log("✅ Paciente encontrado:", pessoa.nomeCompleto);
                localStorage.setItem("pacienteSelecionado", JSON.stringify(pessoa));
                window.location.href = `paciente-detalhes.html?cpf=${cpf}`;
            } else {
                alert(
                    "❌ Erro nos dados do paciente\n\n" +
                    "Os dados retornados estão incompletos.\n\n" +
                    "Tente novamente ou entre em contato com o suporte."
                );
                console.error("Dados do paciente inválidos:", pessoa);
            }
        } catch (err) {
            console.error("❌ Erro ao buscar paciente:", err);
            alert(
                "❌ Erro de Conexão\n\n" +
                "Não foi possível conectar ao servidor.\n\n" +
                "Verifique sua conexão com a internet e tente novamente."
            );
        } finally {
            // ✅ Restaurar estado do campo de busca
            searchBar.disabled = false;
            searchBar.style.opacity = "1";
            searchBar.placeholder = originalPlaceholder;
        }
    }
})();