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

    function formatarDataParaInput(data) {
        if (!data) return "";
        
        if (data.includes('/')) {
            const [dia, mes, ano] = data.split('/');
            return `${ano}-${mes}-${dia}`;
        }
        
        if (data.includes('-')) {
            return data.split('T')[0];
        }
        
        return "";
    }

    function formatDateToDDMMYYYY(isoDate) {
        if (!isoDate) return null;
        const [y, m, d] = isoDate.split("-");
        return `${d}/${m}/${y}`;
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
            removerPaginacao();
            return;
        }

        tbody.innerHTML = '';
        msgVazio.style.display = 'none';

        // ✅ Ordenar do mais recente ao mais antigo (por createdAt ou ID)
        const usuariosOrdenados = [...usuarios].sort((a, b) => {
            // Primeiro tenta ordenar por data de criação
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            // Se não tiver createdAt, ordena por ID (maior ID = mais recente)
            if (a.id && b.id) {
                return b.id - a.id;
            }
            // Fallback: ordena por nome
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

            // ✅ AÇÕES - ADICIONAR BOTÕES DE EDITAR E EXCLUIR
            const cellAcoes = row.insertCell();
            cellAcoes.className = 'action-buttons-cell';
            
            const actionDiv = document.createElement('div');
            actionDiv.style.cssText = 'display: flex; gap: 8px; justify-content: center; align-items: center;';
            
            // Botão Editar
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-action btn-edit';
            btnEditar.innerHTML = '<i class="fa-solid fa-edit"></i> Editar';
            btnEditar.title = 'Editar usuário';
            btnEditar.onclick = () => abrirModalEdicaoUsuario(usuario);
            
            // Botão Excluir
            const btnExcluir = document.createElement('button');
            btnExcluir.className = 'btn-action btn-delete';
            btnExcluir.innerHTML = '<i class="fa-solid fa-trash"></i> Excluir';
            btnExcluir.title = 'Excluir usuário';
            btnExcluir.onclick = () => excluirUsuario(usuario.uuid, usuario.nomeCompleto);
            
            actionDiv.appendChild(btnEditar);
            actionDiv.appendChild(btnExcluir);
            cellAcoes.appendChild(actionDiv);
        });

        console.log(`✅ ${usuarios.length} usuários renderizados na tabela`);
    }

    // ===== MODAL DE EDIÇÃO =====
    window.abrirModalEdicaoUsuario = function(usuario) {
        console.log("📝 Abrindo modal de edição:", usuario);
        
        usuarioEmEdicao = usuario;
        
        document.getElementById('edit-usuario-uuid').value = usuario.uuid;
        document.getElementById('edit-usuario-nome').value = usuario.usuario || '';
        document.getElementById('edit-usuario-cpf').value = formatarCpf(usuario.cpf) || '';
        
        const dataNasc = formatarDataParaInput(usuario.dataNascimento);
        document.getElementById('edit-usuario-data-nascimento').value = dataNasc;
        
        document.getElementById('edit-usuario-nome-completo').value = usuario.nomeCompleto || '';
        document.getElementById('edit-usuario-email').value = usuario.email || '';
        document.getElementById('edit-usuario-telefone').value = usuario.telefone || '';
        document.getElementById('edit-usuario-cargo').value = usuario.cargo || '';
        document.getElementById('edit-usuario-role').value = usuario.role || '';
        
        // Limpar campos de senha
        document.getElementById('edit-usuario-senha').value = '';
        document.getElementById('edit-usuario-confirmar-senha').value = '';
        
        document.getElementById('modal-editar-usuario').style.display = 'flex';
    };

    window.fecharModalEdicaoUsuario = function() {
        document.getElementById('modal-editar-usuario').style.display = 'none';
        document.getElementById('form-editar-usuario').reset();
        usuarioEmEdicao = null;
    };

    // ===== SUBMISSÃO DO FORMULÁRIO DE EDIÇÃO =====
    document.getElementById('form-editar-usuario').addEventListener('submit', async function(e) {
        e.preventDefault();

        const usuarioUuid = document.getElementById('edit-usuario-uuid').value;
        const usuario = document.getElementById('edit-usuario-nome').value.trim();
        const nomeCompleto = document.getElementById('edit-usuario-nome-completo').value.trim();
        const email = document.getElementById('edit-usuario-email').value.trim();
        const telefone = document.getElementById('edit-usuario-telefone').value.replace(/\D/g, '');
        const dataNascimentoInput = document.getElementById('edit-usuario-data-nascimento').value;
        const cargo = document.getElementById('edit-usuario-cargo').value;
        const role = document.getElementById('edit-usuario-role').value;
        const senha = document.getElementById('edit-usuario-senha').value;
        const confirmarSenha = document.getElementById('edit-usuario-confirmar-senha').value;

        // Validações
        if (!usuario || !nomeCompleto || !email || !dataNascimentoInput || !cargo || !role) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Por favor, informe um e-mail válido.");
            return;
        }

        if (senha && senha !== confirmarSenha) {
            alert("As senhas não coincidem.");
            return;
        }

        if (senha && senha.length < 4) {
            alert("A senha deve ter pelo menos 4 caracteres.");
            return;
        }

        const dataNascimento = formatDateToDDMMYYYY(dataNascimentoInput);
        const cpf = usuarioEmEdicao.cpf;

        const payload = {
            nomeCompleto,
            cpf,
            dataNascimento,
            email,
            telefone,
            usuario,
            role,
            cargo
        };

        if (senha) {
            payload.password = senha;
        }

        console.log("📤 Atualizando usuário:", payload);

        try {
            const response = await fetch(`${API_BASE}/usuario/${usuarioUuid}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Usuário atualizado com sucesso!");
                fecharModalEdicaoUsuario();
                await carregarUsuarios();
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Erro ao atualizar usuário: ${errorData.mensagem || response.statusText}`);
            }
        } catch (error) {
            console.error("❌ Erro ao atualizar usuário:", error);
            alert("Erro ao conectar com o servidor.");
        }
    });

    // ===== FUNÇÃO PARA EXCLUIR USUÁRIO =====
    window.excluirUsuario = async function(uuid, nomeCompleto) {
        const confirmacao = confirm(
            `Tem certeza que deseja excluir o usuário "${nomeCompleto}"?\n\n` +
            `Esta ação não pode ser desfeita.`
        );

        if (!confirmacao) return;

        console.log("🗑️ Excluindo usuário:", uuid);

        try {
            const response = await fetch(`${API_BASE}/usuario/${uuid}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok || response.status === 204) {
                alert("Usuário excluído com sucesso!");
                await carregarUsuarios();
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Erro ao excluir usuário: ${errorData.mensagem || response.statusText}`);
            }
        } catch (error) {
            console.error("❌ Erro ao excluir usuário:", error);
            alert("Erro ao conectar com o servidor.");
        }
    };

    // ===== FILTRAR USUÁRIOS =====
    function filtrarUsuarios() {
        const filtroTexto = normalizeText(document.getElementById('filtro-usuario').value.trim());
        const filtroCargo = document.getElementById('filtro-cargo').value;
        const resultadoDiv = document.getElementById('resultado-filtro');
        const btnLimpar = document.getElementById('limpar-filtro');

        if (filtroTexto.length > 0 || filtroCargo) {
            btnLimpar.style.display = 'flex';
        } else {
            btnLimpar.style.display = 'none';
        }

        usuariosFiltrados = todosUsuarios.filter(usuario => {
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

            let passaFiltroCargo = true;
            if (filtroCargo) {
                passaFiltroCargo = usuario.cargo === filtroCargo;
            }

            return passaFiltroTexto && passaFiltroCargo;
        });

        if (filtroTexto || filtroCargo) {
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

    function limparFiltros() {
        document.getElementById('filtro-usuario').value = '';
        document.getElementById('filtro-cargo').value = '';
        filtrarUsuarios();
        document.getElementById('filtro-usuario').focus();
    }

    // ===== EVENTOS =====
    const filtroInput = document.getElementById('filtro-usuario');
    const filtroCargo = document.getElementById('filtro-cargo');
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

    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparFiltros);
    }

    // Máscaras
    const telefoneInput = document.getElementById('edit-usuario-telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > 11) value = value.slice(0, 11);
            
            if (value.length === 0) {
                e.target.value = "";
            } else if (value.length <= 2) {
                e.target.value = `(${value}`;
            } else if (value.length <= 7) {
                e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            } else {
                e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
            }
        });
    }

    // Fechar modal ao clicar fora
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('modal-editar-usuario');
        if (e.target === modal) {
            fecharModalEdicaoUsuario();
        }
    });

    // ===== INICIALIZAR =====
    carregarUsuarios();
})();