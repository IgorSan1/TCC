(function() {
    const API_BASE = "http://localhost:8080/api/v1";
    const token = localStorage.getItem("token");

    let todosPacientes = [];
    let pacientesFiltrados = [];
    let paginaAtual = 1;
    const ITENS_POR_PAGINA = 10;
    let isAdmin = false;

    // ===== VERIFICAR PERMISSÃO =====
    function verificarPermissao() {
        if (!token) {
            alert("Você precisa estar logado para acessar esta página.");
            window.location.href = "login.html";
            return false;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            isAdmin = payload.role === 'ADMIN';
            
            console.log("👤 Role do usuário:", payload.role);
            console.log("🔐 É Admin:", isAdmin);
            
            return true;
        } catch (e) {
            console.error("❌ Erro ao verificar permissão:", e);
            alert("Sessão inválida. Faça login novamente.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return false;
        }
    }

    // ===== CONFIGURAR INTERFACE BASEADA EM PERMISSÃO =====
    function configurarInterface() {
        const filtroStatusContainer = document.getElementById('filtro-status-container');
        const colunaStatusHeader = document.getElementById('coluna-status-header');
        
        if (isAdmin) {
            // Admin vê filtro de status e coluna de status
            if (filtroStatusContainer) filtroStatusContainer.style.display = 'block';
            if (colunaStatusHeader) colunaStatusHeader.style.display = 'table-cell';
            console.log("✅ Interface ADMIN configurada");
        } else {
            // User não vê filtro de status nem coluna
            if (filtroStatusContainer) filtroStatusContainer.style.display = 'none';
            if (colunaStatusHeader) colunaStatusHeader.style.display = 'none';
            console.log("✅ Interface USER configurada");
        }
    }

    // ===== FUNÇÕES AUXILIARES =====
    function formatarCpf(cpf) {
        if (!cpf || cpf.length !== 11) return cpf;
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    function formatarData(data) {
        if (!data) return "-";
        
        if (data.includes('/')) return data;
        
        if (data.includes('-')) {
            const [ano, mes, dia] = data.split('-');
            return `${dia}/${mes}/${ano}`;
        }
        
        return data;
    }

    function normalizeText(text) {
        return text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    // ===== CARREGAR PACIENTES =====
    async function carregarPacientes() {
        const loading = document.getElementById('loading');
        const tbody = document.getElementById('pacientes-table-body');
        const msgVazio = document.getElementById('pacientes-vazio');

        loading.style.display = 'block';
        tbody.innerHTML = '';
        msgVazio.style.display = 'none';

        try {
            console.log("📥 Carregando pacientes...");

            // USER: buscar apenas ativos | ADMIN: buscar todos
            const endpoint = isAdmin ? 
                `${API_BASE}/pessoa/all?size=1000&page=0` : 
                `${API_BASE}/pessoa?size=1000&page=0`;

            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erro ao carregar pacientes: ${response.status}`);
            }

            const data = await response.json();
            console.log("📦 Resposta da API:", data);

            let pacientes = [];
            if (Array.isArray(data?.dados) && Array.isArray(data.dados[0])) {
                pacientes = data.dados[0];
            } else if (Array.isArray(data?.dados)) {
                pacientes = data.dados;
            }

            todosPacientes = pacientes;
            pacientesFiltrados = [...pacientes];

            console.log(`✅ ${pacientes.length} pacientes carregados`);
            console.log(`👥 Endpoint usado: ${isAdmin ? '/all (ADMIN)' : '/ (USER - apenas ativos)'}`);

            renderizarTabela(pacientes);

        } catch (error) {
            console.error("❌ Erro ao carregar pacientes:", error);
            alert("Erro ao carregar pacientes. Verifique sua conexão.");
        } finally {
            loading.style.display = 'none';
        }
    }

    // ===== RENDERIZAR TABELA =====
    function renderizarTabela(pacientes) {
        const tbody = document.getElementById('pacientes-table-body');
        const msgVazio = document.getElementById('pacientes-vazio');

        if (pacientes.length === 0) {
            tbody.innerHTML = '';
            msgVazio.style.display = 'block';
            removerPaginacao();
            return;
        }

        tbody.innerHTML = '';
        msgVazio.style.display = 'none';

        // Ordenar por mais recente
        const pacientesOrdenados = [...pacientes].sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            if (a.id && b.id) {
                return b.id - a.id;
            }
            return a.nomeCompleto.localeCompare(b.nomeCompleto);
        });

        // Paginação
        const totalPaginas = Math.ceil(pacientesOrdenados.length / ITENS_POR_PAGINA);
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        const fim = inicio + ITENS_POR_PAGINA;
        const pacientesPaginados = pacientesOrdenados.slice(inicio, fim);

        pacientesPaginados.forEach(paciente => {
            const row = tbody.insertRow();

            // Nome Completo
            row.insertCell().textContent = paciente.nomeCompleto || '-';

            // CPF
            row.insertCell().textContent = formatarCpf(paciente.cpf) || '-';

            // Data Nascimento
            row.insertCell().textContent = formatarData(paciente.dataNascimento) || '-';

            // Sexo
            row.insertCell().textContent = paciente.sexo || '-';

            // Comunidade
            row.insertCell().textContent = paciente.comunidade || '-';

            // ✅ COLUNA STATUS - APENAS PARA ADMIN
            if (isAdmin) {
                const cellStatus = row.insertCell();
                const badgeStatus = document.createElement('span');
                badgeStatus.className = `badge-status ${paciente.ativo ? 'ativo' : 'inativo'}`;
                badgeStatus.textContent = paciente.ativo ? 'Ativo' : 'Inativo';
                cellStatus.appendChild(badgeStatus);
            }

            // Ações
            const cellAcoes = row.insertCell();
            cellAcoes.className = 'action-buttons-cell';
            
            const actionDiv = document.createElement('div');
            actionDiv.style.cssText = 'display: flex; gap: 8px; justify-content: center; align-items: center;';
            
            // Botão Ver Detalhes
            const btnVer = document.createElement('button');
            btnVer.className = 'btn-action btn-view';
            btnVer.innerHTML = '<i class="fa-solid fa-eye"></i> Ver';
            btnVer.title = 'Ver detalhes';
            btnVer.onclick = () => verDetalhes(paciente);
            actionDiv.appendChild(btnVer);
            
            // ✅ Botão Reativar - APENAS PARA ADMIN e PACIENTES INATIVOS
            if (isAdmin && !paciente.ativo) {
                const btnReativar = document.createElement('button');
                btnReativar.className = 'btn-action btn-reactivate';
                btnReativar.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Reativar';
                btnReativar.title = 'Reativar paciente';
                btnReativar.onclick = () => abrirModalReativar(paciente);
                actionDiv.appendChild(btnReativar);
            }
            
            cellAcoes.appendChild(actionDiv);
        });

        criarPaginacao(pacientesOrdenados.length);
        console.log(`✅ ${pacientesPaginados.length} pacientes renderizados (Página ${paginaAtual} de ${totalPaginas})`);
    }

    // ===== VER DETALHES DO PACIENTE =====
    function verDetalhes(paciente) {
        console.log("👁️ Ver detalhes do paciente:", paciente.nomeCompleto);
        localStorage.setItem("pacienteSelecionado", JSON.stringify(paciente));
        window.location.href = `paciente-detalhes.html?cpf=${paciente.cpf}`;
    }

    // ===== MODAL DE REATIVAÇÃO =====
    let pacienteParaReativar = null;

    window.abrirModalReativar = function(paciente) {
        console.log("🔄 Abrindo modal para reativar:", paciente.nomeCompleto);
        pacienteParaReativar = paciente;
        document.getElementById('nome-paciente-reativar').textContent = paciente.nomeCompleto;
        document.getElementById('modal-reativar-paciente').style.display = 'flex';
    };

    window.fecharModalReativar = function() {
        document.getElementById('modal-reativar-paciente').style.display = 'none';
        pacienteParaReativar = null;
    };

    // ===== REATIVAR PACIENTE =====
    document.getElementById('btn-confirmar-reativar').addEventListener('click', async function() {
        if (!pacienteParaReativar) return;

        console.log("🔄 Reativando paciente:", pacienteParaReativar.uuid);

        try {
            // Fazer PUT para atualizar o status
            const payload = {
                nomeCompleto: pacienteParaReativar.nomeCompleto,
                cpf: pacienteParaReativar.cpf,
                sexo: pacienteParaReativar.sexo,
                dataNascimento: formatarData(pacienteParaReativar.dataNascimento),
                comorbidade: pacienteParaReativar.comorbidade || "Nenhuma",
                etnia: pacienteParaReativar.etnia,
                cns: pacienteParaReativar.cns,
                comunidade: pacienteParaReativar.comunidade
            };

            const response = await fetch(`${API_BASE}/pessoa/${pacienteParaReativar.uuid}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok || response.status === 204) {
                alert(`Paciente "${pacienteParaReativar.nomeCompleto}" reativado com sucesso!`);
                fecharModalReativar();
                await carregarPacientes();
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Erro ao reativar paciente: ${errorData.mensagem || response.statusText}`);
            }
        } catch (error) {
            console.error("❌ Erro ao reativar paciente:", error);
            alert("Erro ao conectar com o servidor.");
        }
    });

    // ===== FILTRAR PACIENTES =====
    function filtrarPacientes() {
        const filtroTexto = normalizeText(document.getElementById('filtro-paciente').value.trim());
        const filtroSexo = document.getElementById('filtro-sexo').value;
        const filtroComunidade = normalizeText(document.getElementById('filtro-comunidade').value.trim());
        const filtroStatus = isAdmin ? document.getElementById('filtro-status').value : '';
        
        const resultadoDiv = document.getElementById('resultado-filtro');
        const btnLimpar = document.getElementById('limpar-filtro');

        if (filtroTexto.length > 0 || filtroSexo || filtroComunidade || filtroStatus) {
            btnLimpar.style.display = 'flex';
        } else {
            btnLimpar.style.display = 'none';
        }

        pacientesFiltrados = todosPacientes.filter(paciente => {
            // Filtro de texto
            let passaFiltroTexto = true;
            if (filtroTexto) {
                const nome = normalizeText(paciente.nomeCompleto || '');
                const cpf = paciente.cpf || '';
                const cns = paciente.cns || '';

                passaFiltroTexto = nome.includes(filtroTexto) || 
                                   cpf.includes(filtroTexto) || 
                                   cns.includes(filtroTexto);
            }

            // Filtro de sexo
            let passaFiltroSexo = true;
            if (filtroSexo) {
                passaFiltroSexo = paciente.sexo === filtroSexo;
            }

            // Filtro de comunidade
            let passaFiltroComunidade = true;
            if (filtroComunidade) {
                const comunidade = normalizeText(paciente.comunidade || '');
                passaFiltroComunidade = comunidade.includes(filtroComunidade);
            }

            // Filtro de status (apenas para admin)
            let passaFiltroStatus = true;
            if (isAdmin && filtroStatus) {
                passaFiltroStatus = paciente.ativo === (filtroStatus === 'true');
            }

            return passaFiltroTexto && passaFiltroSexo && passaFiltroComunidade && passaFiltroStatus;
        });

        if (filtroTexto || filtroSexo || filtroComunidade || filtroStatus) {
            if (pacientesFiltrados.length > 0) {
                resultadoDiv.textContent = `${pacientesFiltrados.length} paciente(s) encontrado(s)`;
                resultadoDiv.className = 'resultado-filtro tem-resultados';
            } else {
                resultadoDiv.textContent = 'Nenhum paciente encontrado com estes filtros';
                resultadoDiv.className = 'resultado-filtro sem-resultados';
            }
        } else {
            resultadoDiv.textContent = '';
            resultadoDiv.className = 'resultado-filtro';
        }

        paginaAtual = 1;
        renderizarTabela(pacientesFiltrados);
    }

    function limparFiltros() {
        document.getElementById('filtro-paciente').value = '';
        document.getElementById('filtro-sexo').value = '';
        document.getElementById('filtro-comunidade').value = '';
        if (isAdmin) {
            document.getElementById('filtro-status').value = 'true'; // Default: ativos
        }
        paginaAtual = 1;
        filtrarPacientes();
        document.getElementById('filtro-paciente').focus();
    }

    // ===== PAGINAÇÃO =====
    function criarPaginacao(totalItens) {
        const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA);
        
        const paginacaoExistente = document.querySelector('.paginacao-container');
        if (paginacaoExistente) {
            paginacaoExistente.remove();
        }

        if (totalPaginas <= 1) return;

        const card = document.querySelector('.card');
        const paginacaoContainer = document.createElement('div');
        paginacaoContainer.className = 'paginacao-container';

        const info = document.createElement('div');
        info.className = 'paginacao-info';
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA + 1;
        const fim = Math.min(paginaAtual * ITENS_POR_PAGINA, totalItens);
        info.textContent = `Mostrando ${inicio} a ${fim} de ${totalItens} pacientes`;

        const botoesContainer = document.createElement('div');
        botoesContainer.className = 'paginacao-botoes';

        const btnAnterior = criarBotaoPaginacao(
            '<i class="fa-solid fa-chevron-left"></i> Anterior',
            paginaAtual === 1,
            () => {
                if (paginaAtual > 1) {
                    paginaAtual--;
                    renderizarTabela(pacientesFiltrados);
                    scrollToTop();
                }
            }
        );

        const paginasNumeros = document.createElement('div');
        paginasNumeros.style.cssText = 'display: flex; gap: 0.3rem;';

        for (let i = 1; i <= Math.min(totalPaginas, 5); i++) {
            const btnPagina = criarBotaoNumeroPagina(i, i === paginaAtual);
            paginasNumeros.appendChild(btnPagina);
        }

        const btnProximo = criarBotaoPaginacao(
            'Próximo <i class="fa-solid fa-chevron-right"></i>',
            paginaAtual === totalPaginas,
            () => {
                if (paginaAtual < totalPaginas) {
                    paginaAtual++;
                    renderizarTabela(pacientesFiltrados);
                    scrollToTop();
                }
            }
        );

        botoesContainer.appendChild(btnAnterior);
        botoesContainer.appendChild(paginasNumeros);
        botoesContainer.appendChild(btnProximo);

        paginacaoContainer.appendChild(info);
        paginacaoContainer.appendChild(botoesContainer);
        card.appendChild(paginacaoContainer);
    }

    function criarBotaoPaginacao(html, disabled, onClick) {
        const btn = document.createElement('button');
        btn.className = 'btn-paginacao';
        btn.innerHTML = html;
        btn.disabled = disabled;
        if (!disabled) btn.onclick = onClick;
        return btn;
    }

    function criarBotaoNumeroPagina(numero, isAtiva) {
        const btn = document.createElement('button');
        btn.className = `btn-pagina-numero ${isAtiva ? 'ativa' : ''}`;
        btn.textContent = numero;
        if (!isAtiva) {
            btn.onclick = () => {
                paginaAtual = numero;
                renderizarTabela(pacientesFiltrados);
                scrollToTop();
            };
        }
        return btn;
    }

    function removerPaginacao() {
        const paginacaoExistente = document.querySelector('.paginacao-container');
        if (paginacaoExistente) paginacaoExistente.remove();
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ===== EVENTOS =====
    const filtroInput = document.getElementById('filtro-paciente');
    const filtroSexo = document.getElementById('filtro-sexo');
    const filtroComunidade = document.getElementById('filtro-comunidade');
    const filtroStatus = document.getElementById('filtro-status');
    const btnLimpar = document.getElementById('limpar-filtro');

    if (filtroInput) {
        let debounceTimer;
        filtroInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filtrarPacientes, 300);
        });
    }

    if (filtroSexo) filtroSexo.addEventListener('change', filtrarPacientes);
    if (filtroComunidade) {
        let debounceTimer;
        filtroComunidade.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filtrarPacientes, 300);
        });
    }
    if (filtroStatus) filtroStatus.addEventListener('change', filtrarPacientes);
    if (btnLimpar) btnLimpar.addEventListener('click', limparFiltros);

    // Fechar modal ao clicar fora
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('modal-reativar-paciente');
        if (e.target === modal) {
            fecharModalReativar();
        }
    });

    // ===== INICIALIZAR =====
    if (verificarPermissao()) {
        configurarInterface();
        carregarPacientes();
    }
})();