(function() {
    const API_BASE = "http://localhost:8080/api/v1";
    const token = localStorage.getItem("token");

    let todosUsuarios = [];
    let usuariosFiltrados = [];
    let paginaAtual = 1;
    const ITENS_POR_PAGINA = 5;
    let usuarioEmEdicao = null;

    // ===== VERIFICAR PERMISSÃO ADMIN =====
    function verificarPermissaoAdmin() {
        if (!token) {
            alert("Você precisa estar logado para acessar esta página.");
            window.location.href = "login.html";
            return false;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log("🔐 Verificando permissão - Role:", payload.role);
            
            if (payload.role !== 'ADMIN') {
                alert("⚠️ ACESSO NEGADO\n\nApenas administradores podem acessar esta página.");
                window.location.href = "home.html";
                return false;
            }
            
            return true;
        } catch (e) {
            console.error("❌ Erro ao verificar permissão:", e);
            alert("Sessão inválida. Faça login novamente.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return false;
        }
    }

    // Verificar permissão antes de continuar
    if (!verificarPermissaoAdmin()) {
        return;
    }

    // ===== FUNÇÕES AUXILIARES =====
    function formatarCpf(cpf) {
        if (!cpf) return "";
        const digits = cpf.replace(/\D/g, "");
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    function formatarTelefone(telefone) {
        if (!telefone) return "-";
        const digits = telefone.replace(/\D/g, "");
        if (digits.length === 11) {
            return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        } else if (digits.length === 10) {
            return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
        }
        return telefone;
    }

    function formatarCargo(cargo) {
        if (!cargo) return "-";
        const cargos = {
            'TECNICO': 'Técnico',
            'ENFERMEIRO': 'Enfermeiro',
            'TECNICO_DE_ENFERMAGEM': 'Técnico de Enfermagem'
        };
        return cargos[cargo] || cargo;
    }

    function normalizeText(text) {
        return text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    // ===== CARREGAR USUÁRIOS =====
    async function carregarUsuarios() {
        const loading = document.getElementById('loading');
        const tbody = document.getElementById('usuarios-table-body');
        const msgVazio = document.getElementById('usuarios-vazio');

        loading.style.display = 'block';
        tbody.innerHTML = '';
        msgVazio.style.display = 'none';

        try {
            console.log("📥 Carregando usuários...");

            const response = await fetch(`${API_BASE}/usuario?size=1000&page=0`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erro ao carregar usuários: ${response.status}`);
            }

            const data = await response.json();
            console.log("📦 Resposta da API:", data);

            // Normalizar resposta
            let usuarios = [];
            if (Array.isArray(data?.dados) && Array.isArray(data.dados[0])) {
                usuarios = data.dados[0];
            } else if (Array.isArray(data?.dados)) {
                usuarios = data.dados;
            }

            todosUsuarios = usuarios;
            usuariosFiltrados = [...usuarios];

            console.log(`✅ ${usuarios.length} usuários carregados`);

            renderizarTabela(usuarios);

        } catch (error) {
            console.error("❌ Erro ao carregar usuários:", error);
            alert("Erro ao carregar usuários. Verifique sua conexão.");
        } finally {
            loading.style.display = 'none';
        }
    }

    // ===== RENDERIZAR TABELA =====
    function renderizarTabela(usuarios) {
        const tbody = document.getElementById('usuarios-table-body');
        const msgVazio = document.getElementById('usuarios-vazio');

        if (usuarios.length === 0) {
            tbody.innerHTML = '';
            msgVazio.style.display = 'block';
            return;
        }

        tbody.innerHTML = '';
        msgVazio.style.display = 'none';

        // Ordenar por nome
        const usuariosOrdenados = [...usuarios].sort((a, b) => {
            return a.nomeCompleto.localeCompare(b.nomeCompleto);
        });

        usuariosOrdenados.forEach(usuario => {
            const row = tbody.insertRow();

            // Nome Completo
            row.insertCell().textContent = usuario.nomeCompleto || '-';

            // Usuário
            row.insertCell().textContent = usuario.usuario || '-';

            // E-mail
            row.insertCell().textContent = usuario.email || '-';

            // Cargo
            const cellCargo = row.insertCell();
            const badgeCargo = document.createElement('span');
            badgeCargo.className = 'badge-cargo';
            badgeCargo.textContent = formatarCargo(usuario.cargo);
            cellCargo.appendChild(badgeCargo);

            // Perfil (Role)
            const cellRole = row.insertCell();
            const badgeRole = document.createElement('span');
            badgeRole.className = `badge-role ${usuario.role === 'ADMIN' ? 'admin' : 'user'}`;
            badgeRole.textContent = usuario.role === 'ADMIN' ? 'Administrador' : 'Usuário';
            cellRole.appendChild(badgeRole);

            // Telefone
            row.insertCell().textContent = formatarTelefone(usuario.telefone);
        });

        console.log(`✅ ${usuarios.length} usuários renderizados na tabela`);
    }

    // ===== FILTRAR USUÁRIOS =====
    function filtrarUsuarios() {
        const filtroTexto = normalizeText(document.getElementById('filtro-usuario').value.trim());
        const filtroCargo = document.getElementById('filtro-cargo').value;
        const filtroRole = document.getElementById('filtro-role').value;
        const resultadoDiv = document.getElementById('resultado-filtro');
        const btnLimpar = document.getElementById('limpar-filtro');

        // Mostrar/ocultar botão limpar
        if (filtroTexto.length > 0 || filtroCargo || filtroRole) {
            btnLimpar.style.display = 'flex';
        } else {
            btnLimpar.style.display = 'none';
        }

        // Aplicar filtros
        usuariosFiltrados = todosUsuarios.filter(usuario => {
            // Filtro de texto (busca em nome, usuário, CPF e e-mail)
            let passaFiltroTexto = true;
            if (filtroTexto) {
                const nome = normalizeText(usuario.nomeCompleto || '');
                const user = normalizeText(usuario.usuario || '');
                const cpf = usuario.cpf || '';
                const email = normalizeText(usuario.email || '');

                passaFiltroTexto = nome.includes(filtroTexto) || 
                                   user.includes(filtroTexto) || 
                                   cpf.includes(filtroTexto) || 
                                   email.includes(filtroTexto);
            }

            // Filtro de cargo
            let passaFiltroCargo = true;
            if (filtroCargo) {
                passaFiltroCargo = usuario.cargo === filtroCargo;
            }

            // Filtro de role
            let passaFiltroRole = true;
            if (filtroRole) {
                passaFiltroRole = usuario.role === filtroRole;
            }

            return passaFiltroTexto && passaFiltroCargo && passaFiltroRole;
        });

        // Atualizar mensagem de resultado
        if (filtroTexto || filtroCargo || filtroRole) {
            if (usuariosFiltrados.length > 0) {
                resultadoDiv.textContent = `${usuariosFiltrados.length} usuário(s) encontrado(s)`;
                resultadoDiv.className = 'resultado-filtro tem-resultados';
            } else {
                resultadoDiv.textContent = 'Nenhum usuário encontrado com estes filtros';
                resultadoDiv.className = 'resultado-filtro sem-resultados';
            }
        } else {
            resultadoDiv.textContent = '';
            resultadoDiv.className = 'resultado-filtro';
        }

        renderizarTabela(usuariosFiltrados);
    }

    // ===== LIMPAR FILTROS =====
    function limparFiltros() {
        document.getElementById('filtro-usuario').value = '';
        document.getElementById('filtro-cargo').value = '';
        document.getElementById('filtro-role').value = '';
        filtrarUsuarios();
        document.getElementById('filtro-usuario').focus();
    }

    // ===== EVENTOS =====
    const filtroInput = document.getElementById('filtro-usuario');
    const filtroCargo = document.getElementById('filtro-cargo');
    const filtroRole = document.getElementById('filtro-role');
    const btnLimpar = document.getElementById('limpar-filtro');

    if (filtroInput) {
        let debounceTimer;
        filtroInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filtrarUsuarios, 300);
        });

        filtroInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                filtrarUsuarios();
            }
        });
    }

    if (filtroCargo) {
        filtroCargo.addEventListener('change', filtrarUsuarios);
    }

    if (filtroRole) {
        filtroRole.addEventListener('change', filtrarUsuarios);
    }

    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparFiltros);
    }

    // ===== INICIALIZAR =====
    carregarUsuarios();
})();