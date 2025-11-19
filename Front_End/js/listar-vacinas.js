(function() {
    const API_BASE = "http://localhost:8080/api/v1";
    const token = localStorage.getItem("token");

    let todasVacinas = [];
    let vacinasFiltradas = [];
    let vacinaEmEdicao = null;
    let paginaAtual = 1;
    const ITENS_POR_PAGINA = 5;

    // ===== VERIFICAR AUTENTICAÇÃO =====
    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "login.html";
        return;
    }

    // ===== FUNÇÕES AUXILIARES =====
    function formatarData(data) {
        if (!data) return "-";
        
        if (data.includes('/')) {
            return data;
        }
        
        if (data.includes('-')) {
            const [ano, mes, dia] = data.split('-');
            return `${dia}/${mes}/${ano}`;
        }
        
        return data;
    }

    function verificarVencimento(dataValidade) {
        if (!dataValidade) return 'vencida';
        
        // Converte a data de validade para objeto Date
        let dataValidadeObj;
        
        if (dataValidade.includes('/')) {
            const [dia, mes, ano] = dataValidade.split('/');
            dataValidadeObj = new Date(ano, mes - 1, dia);
        } else if (dataValidade.includes('-')) {
            const [ano, mes, dia] = dataValidade.split('-');
            dataValidadeObj = new Date(ano, mes - 1, dia.split('T')[0]);
        } else {
            return 'vencida';
        }
        
        // Compara com a data atual
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas a data
        
        return dataValidadeObj >= hoje ? 'valida' : 'vencida';
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

    function formatarFabricante(fabricante) {
        if (!fabricante) return "-";
        
        const fabricantes = {
            'PFIZER_BIONTECH': 'Pfizer Biontech',
            'ASTRAZENECA_FIOCRUZ': 'AstraZeneca Fiocruz',
            'SINOVAC_BUTANTAN': 'Sinovac Butantan',
            'JANSSEN': 'Janssen',
            'MODERNA': 'Moderna',
            'SERUM_INSTITUTE': 'Serum Institute of India',
            'SANOFI_PASTEUR': 'Sanofi Pasteur',
            'GLAXOSMITHKLINE': 'GlaxoSmithKline',
            'MERCK_SHARP_DOHME': 'Merck Sharp & Dohme'
        };
        
        return fabricantes[fabricante] || fabricante;
    }

    function normalizeText(text) {
        return text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    // ===== CARREGAR VACINAS =====
    async function carregarVacinas() {
        const loading = document.getElementById('loading');
        const tbody = document.getElementById('vacinas-table-body');
        const msgVazio = document.getElementById('vacinas-vazio');

        loading.style.display = 'block';
        tbody.innerHTML = '';
        msgVazio.style.display = 'none';

        try {
            console.log("📥 Carregando vacinas...");

            const response = await fetch(`${API_BASE}/vacina?size=1000&page=0`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erro ao carregar vacinas: ${response.status}`);
            }

            const data = await response.json();
            console.log("📦 Resposta da API:", data);

            let vacinas = [];
            if (Array.isArray(data?.dados) && Array.isArray(data.dados[0])) {
                vacinas = data.dados[0];
            } else if (Array.isArray(data?.dados)) {
                vacinas = data.dados;
            }

            todasVacinas = vacinas;
            vacinasFiltradas = [...vacinas];

            console.log(`✅ ${vacinas.length} vacinas carregadas`);

            renderizarTabela(vacinas);

        } catch (error) {
            console.error("❌ Erro ao carregar vacinas:", error);
            alert("Erro ao carregar vacinas. Verifique sua conexão.");
        } finally {
            loading.style.display = 'none';
        }
    }

    // ===== RENDERIZAR TABELA =====
    function renderizarTabela(vacinas) {
        const tbody = document.getElementById('vacinas-table-body');
        const msgVazio = document.getElementById('vacinas-vazio');

        if (vacinas.length === 0) {
            tbody.innerHTML = '';
            msgVazio.style.display = 'block';
            removerPaginacao();
            return;
        }

        tbody.innerHTML = '';
        msgVazio.style.display = 'none';

        // Ordenar do mais recente ao mais antigo (sempre)
        const vacinasOrdenadas = [...vacinas].sort((a, b) => {
            // Primeiro tenta ordenar por data de criação
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            // Se não tiver createdAt, ordena por ID (maior ID = mais recente)
            if (a.id && b.id) {
                return b.id - a.id;
            }
            // Fallback: ordena por nome
            return a.nome.localeCompare(b.nome);
        });

        // Calcular paginação
        const totalPaginas = Math.ceil(vacinasOrdenadas.length / ITENS_POR_PAGINA);
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        const fim = inicio + ITENS_POR_PAGINA;
        const vacinasPaginadas = vacinasOrdenadas.slice(inicio, fim);

        // Renderizar apenas as vacinas da página atual
        vacinasPaginadas.forEach(vacina => {
            const row = tbody.insertRow();

            // Nome
            row.insertCell().textContent = vacina.nome || '-';

            // Lote
            row.insertCell().textContent = vacina.numeroLote || '-';

            // Fabricante
            row.insertCell().textContent = formatarFabricante(vacina.fabricante);

            // Data Fabricação
            row.insertCell().textContent = formatarData(vacina.dataFabricacao);

            // Data Validade
            row.insertCell().textContent = formatarData(vacina.dataValidade);

            // Status (Válida ou Vencida)
            const cellStatus = row.insertCell();
            const status = verificarVencimento(vacina.dataValidade);
            const badgeStatus = document.createElement('span');
            badgeStatus.className = `badge-status ${status}`;
            badgeStatus.textContent = status === 'valida' ? 'Válida' : 'Vencida';
            cellStatus.appendChild(badgeStatus);

            // Ações
            const cellAcoes = row.insertCell();
            cellAcoes.className = 'action-buttons-cell';
            
            const actionDiv = document.createElement('div');
            actionDiv.style.cssText = 'display: flex; gap: 8px; justify-content: center; align-items: center;';
            
            // Botão Editar
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-action btn-edit';
            btnEditar.innerHTML = '<i class="fa-solid fa-edit"></i> Editar';
            btnEditar.title = 'Editar vacina';
            btnEditar.onclick = () => abrirModalEdicaoVacina(vacina);
            
            // Botão Excluir
            const btnExcluir = document.createElement('button');
            btnExcluir.className = 'btn-action btn-delete';
            btnExcluir.innerHTML = '<i class="fa-solid fa-trash"></i> Excluir';
            btnExcluir.title = 'Excluir vacina';
            btnExcluir.onclick = () => excluirVacina(vacina.uuid, vacina.nome);
            
            actionDiv.appendChild(btnEditar);
            actionDiv.appendChild(btnExcluir);
            cellAcoes.appendChild(actionDiv);
        });

        // Criar/atualizar paginação
        criarPaginacao(vacinasOrdenadas.length);

        console.log(`✅ ${vacinasPaginadas.length} vacinas renderizadas na tabela (Página ${paginaAtual} de ${totalPaginas})`);
    }

    // ===== PAGINAÇÃO =====
    function criarPaginacao(totalItens) {
        const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA);
        
        // Remover paginação existente
        const paginacaoExistente = document.querySelector('.paginacao-container');
        if (paginacaoExistente) {
            paginacaoExistente.remove();
        }

        // Se tiver apenas 1 página ou menos, não mostrar paginação
        if (totalPaginas <= 1) {
            return;
        }

        // Encontrar o card principal
        const card = document.querySelector('.card');
        if (!card) return;

        // Criar container de paginação
        const paginacaoContainer = document.createElement('div');
        paginacaoContainer.className = 'paginacao-container';
        paginacaoContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border-color);
        `;

        // Info de paginação
        const info = document.createElement('div');
        info.className = 'paginacao-info';
        info.style.cssText = 'color: var(--text-secondary); font-size: 0.9rem;';
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA + 1;
        const fim = Math.min(paginaAtual * ITENS_POR_PAGINA, totalItens);
        info.textContent = `Mostrando ${inicio} a ${fim} de ${totalItens} vacinas`;

        // Container de botões
        const botoesContainer = document.createElement('div');
        botoesContainer.className = 'paginacao-botoes';
        botoesContainer.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';

        // Botão Anterior
        const btnAnterior = criarBotaoPaginacao(
            '<i class="fa-solid fa-chevron-left"></i> Anterior',
            paginaAtual === 1,
            () => {
                if (paginaAtual > 1) {
                    paginaAtual--;
                    renderizarTabela(vacinasFiltradas);
                    scrollToTop();
                }
            }
        );

        // Botões de números de página
        const paginasNumeros = document.createElement('div');
        paginasNumeros.style.cssText = 'display: flex; gap: 0.3rem;';

        // Lógica para mostrar páginas (máximo 5 botões visíveis)
        let paginasVisiveis = [];
        if (totalPaginas <= 5) {
            // Mostrar todas as páginas
            for (let i = 1; i <= totalPaginas; i++) {
                paginasVisiveis.push(i);
            }
        } else {
            // Lógica complexa para páginas dinâmicas
            if (paginaAtual <= 3) {
                paginasVisiveis = [1, 2, 3, 4, '...', totalPaginas];
            } else if (paginaAtual >= totalPaginas - 2) {
                paginasVisiveis = [1, '...', totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas];
            } else {
                paginasVisiveis = [1, '...', paginaAtual - 1, paginaAtual, paginaAtual + 1, '...', totalPaginas];
            }
        }

        paginasVisiveis.forEach(numeroPagina => {
            if (numeroPagina === '...') {
                const reticencias = document.createElement('span');
                reticencias.textContent = '...';
                reticencias.style.cssText = 'padding: 0.5rem; color: var(--text-secondary);';
                paginasNumeros.appendChild(reticencias);
            } else {
                const btnPagina = criarBotaoNumeroPagina(numeroPagina, numeroPagina === paginaAtual);
                paginasNumeros.appendChild(btnPagina);
            }
        });

        // Botão Próximo
        const btnProximo = criarBotaoPaginacao(
            'Próximo <i class="fa-solid fa-chevron-right"></i>',
            paginaAtual === totalPaginas,
            () => {
                if (paginaAtual < totalPaginas) {
                    paginaAtual++;
                    renderizarTabela(vacinasFiltradas);
                    scrollToTop();
                }
            }
        );

        // Montar estrutura
        botoesContainer.appendChild(btnAnterior);
        botoesContainer.appendChild(paginasNumeros);
        botoesContainer.appendChild(btnProximo);

        paginacaoContainer.appendChild(info);
        paginacaoContainer.appendChild(botoesContainer);

        // Adicionar ao card
        card.appendChild(paginacaoContainer);
    }

    function criarBotaoPaginacao(html, disabled, onClick) {
        const btn = document.createElement('button');
        btn.className = 'btn-paginacao';
        btn.innerHTML = html;
        btn.disabled = disabled;
        btn.style.cssText = `
            padding: 0.5rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background-color: ${disabled ? 'var(--background-color)' : 'var(--card-background)'};
            color: ${disabled ? 'var(--text-secondary)' : 'var(--text-primary)'};
            cursor: ${disabled ? 'not-allowed' : 'pointer'};
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            opacity: ${disabled ? '0.6' : '1'};
        `;
        
        if (!disabled) {
            btn.onmouseover = () => {
                btn.style.backgroundColor = 'var(--background-color)';
                btn.style.borderColor = 'var(--primary-blue)';
            };
            btn.onmouseout = () => {
                btn.style.backgroundColor = 'var(--card-background)';
                btn.style.borderColor = 'var(--border-color)';
            };
            btn.onclick = onClick;
        }
        
        return btn;
    }

    function criarBotaoNumeroPagina(numero, isAtiva) {
        const btn = document.createElement('button');
        btn.className = 'btn-pagina-numero';
        btn.textContent = numero;
        btn.style.cssText = `
            padding: 0.5rem 0.75rem;
            border: 1px solid ${isAtiva ? 'var(--primary-blue)' : 'var(--border-color)'};
            border-radius: 8px;
            background-color: ${isAtiva ? 'var(--primary-blue)' : 'var(--card-background)'};
            color: ${isAtiva ? 'white' : 'var(--text-primary)'};
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: ${isAtiva ? '600' : '500'};
            min-width: 40px;
            transition: all 0.2s ease;
        `;
        
        if (!isAtiva) {
            btn.onmouseover = () => {
                btn.style.backgroundColor = 'var(--background-color)';
                btn.style.borderColor = 'var(--primary-blue)';
            };
            btn.onmouseout = () => {
                btn.style.backgroundColor = 'var(--card-background)';
                btn.style.borderColor = 'var(--border-color)';
            };
            btn.onclick = () => {
                paginaAtual = numero;
                renderizarTabela(vacinasFiltradas);
                scrollToTop();
            };
        }
        
        return btn;
    }

    function removerPaginacao() {
        const paginacaoExistente = document.querySelector('.paginacao-container');
        if (paginacaoExistente) {
            paginacaoExistente.remove();
        }
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ===== MODAL DE EDIÇÃO =====
    window.abrirModalEdicaoVacina = function(vacina) {
        console.log("📝 Abrindo modal de edição:", vacina);
        
        vacinaEmEdicao = vacina;
        
        document.getElementById('edit-vacina-uuid').value = vacina.uuid;
        document.getElementById('edit-vacina-nome').value = vacina.nome || '';
        document.getElementById('edit-vacina-lote').value = vacina.numeroLote || '';
        document.getElementById('edit-vacina-fabricante').value = vacina.fabricante || '';
        
        const dataFabricacao = formatarDataParaInput(vacina.dataFabricacao);
        document.getElementById('edit-vacina-fabricacao').value = dataFabricacao;
        
        const dataValidade = formatarDataParaInput(vacina.dataValidade);
        document.getElementById('edit-vacina-validade').value = dataValidade;
        
        document.getElementById('modal-editar-vacina').style.display = 'flex';
    };

    window.fecharModalEdicaoVacina = function() {
        document.getElementById('modal-editar-vacina').style.display = 'none';
        document.getElementById('form-editar-vacina').reset();
        vacinaEmEdicao = null;
    };

    // ===== SUBMISSÃO DO FORMULÁRIO DE EDIÇÃO =====
    document.getElementById('form-editar-vacina').addEventListener('submit', async function(e) {
        e.preventDefault();

        const vacinaUuid = document.getElementById('edit-vacina-uuid').value;
        const nome = document.getElementById('edit-vacina-nome').value.trim();
        const numeroLote = document.getElementById('edit-vacina-lote').value.trim();
        const fabricante = document.getElementById('edit-vacina-fabricante').value;
        const dataFabricacaoInput = document.getElementById('edit-vacina-fabricacao').value;
        const dataValidadeInput = document.getElementById('edit-vacina-validade').value;

        // Validações
        if (!nome || !numeroLote || !fabricante || !dataFabricacaoInput || !dataValidadeInput) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        const dataFabricacao = formatDateToDDMMYYYY(dataFabricacaoInput);
        const dataValidade = formatDateToDDMMYYYY(dataValidadeInput);

        const payload = {
            nome,
            numeroLote,
            fabricante,
            dataFabricacao,
            dataValidade
        };

        console.log("📤 Atualizando vacina:", payload);

        try {
            const response = await fetch(`${API_BASE}/vacina/${vacinaUuid}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok || response.status === 204) {
                alert("Vacina atualizada com sucesso!");
                fecharModalEdicaoVacina();
                await carregarVacinas();
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Erro ao atualizar vacina: ${errorData.mensagem || response.statusText}`);
            }
        } catch (error) {
            console.error("❌ Erro ao atualizar vacina:", error);
            alert("Erro ao conectar com o servidor.");
        }
    });

    // ===== FUNÇÃO PARA EXCLUIR VACINA =====
    window.excluirVacina = async function(uuid, nome) {
        const confirmacao = confirm(
            `Tem certeza que deseja excluir a vacina "${nome}"?\n\n` +
            `Esta ação não pode ser desfeita.`
        );

        if (!confirmacao) return;

        console.log("🗑️ Excluindo vacina:", uuid);

        try {
            const response = await fetch(`${API_BASE}/vacina/${uuid}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok || response.status === 204) {
                alert("Vacina excluída com sucesso!");
                await carregarVacinas();
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Erro ao excluir vacina: ${errorData.mensagem || response.statusText}`);
            }
        } catch (error) {
            console.error("❌ Erro ao excluir vacina:", error);
            alert("Erro ao conectar com o servidor.");
        }
    };

    // ===== FILTRAR VACINAS =====
    function filtrarVacinas() {
        const filtroTexto = normalizeText(document.getElementById('filtro-vacina').value.trim());
        const filtroFabricante = document.getElementById('filtro-fabricante').value;
        const filtroStatus = document.getElementById('filtro-status').value;
        const resultadoDiv = document.getElementById('resultado-filtro');
        const btnLimpar = document.getElementById('limpar-filtro');

        if (filtroTexto.length > 0 || filtroFabricante || filtroStatus) {
            btnLimpar.style.display = 'flex';
        } else {
            btnLimpar.style.display = 'none';
        }

        vacinasFiltradas = todasVacinas.filter(vacina => {
            let passaFiltroTexto = true;
            if (filtroTexto) {
                const nome = normalizeText(vacina.nome || '');
                const lote = normalizeText(vacina.numeroLote || '');
                const fabricante = normalizeText(formatarFabricante(vacina.fabricante));

                passaFiltroTexto = nome.includes(filtroTexto) || 
                                   lote.includes(filtroTexto) || 
                                   fabricante.includes(filtroTexto);
            }

            let passaFiltroFabricante = true;
            if (filtroFabricante) {
                passaFiltroFabricante = vacina.fabricante === filtroFabricante;
            }

            let passaFiltroStatus = true;
            if (filtroStatus) {
                const statusVacina = verificarVencimento(vacina.dataValidade);
                passaFiltroStatus = statusVacina === filtroStatus;
            }

            return passaFiltroTexto && passaFiltroFabricante && passaFiltroStatus;
        });

        if (filtroTexto || filtroFabricante || filtroStatus) {
            if (vacinasFiltradas.length > 0) {
                resultadoDiv.textContent = `${vacinasFiltradas.length} vacina(s) encontrada(s)`;
                resultadoDiv.className = 'resultado-filtro tem-resultados';
            } else {
                resultadoDiv.textContent = 'Nenhuma vacina encontrada com estes filtros';
                resultadoDiv.className = 'resultado-filtro sem-resultados';
            }
        } else {
            resultadoDiv.textContent = '';
            resultadoDiv.className = 'resultado-filtro';
        }

        // Resetar para primeira página ao filtrar
        paginaAtual = 1;
        renderizarTabela(vacinasFiltradas);
    }

    function limparFiltros() {
        document.getElementById('filtro-vacina').value = '';
        document.getElementById('filtro-fabricante').value = '';
        document.getElementById('filtro-status').value = '';
        paginaAtual = 1; // Resetar página ao limpar filtros
        filtrarVacinas();
        document.getElementById('filtro-vacina').focus();
    }

    // ===== EVENTOS =====
    const filtroInput = document.getElementById('filtro-vacina');
    const filtroFabricante = document.getElementById('filtro-fabricante');
    const filtroStatus = document.getElementById('filtro-status');
    const btnLimpar = document.getElementById('limpar-filtro');

    if (filtroInput) {
        let debounceTimer;
        filtroInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filtrarVacinas, 300);
        });

        filtroInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                filtrarVacinas();
            }
        });
    }

    if (filtroFabricante) {
        filtroFabricante.addEventListener('change', filtrarVacinas);
    }

    if (filtroStatus) {
        filtroStatus.addEventListener('change', filtrarVacinas);
    }

    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparFiltros);
    }

    // Fechar modal ao clicar fora
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('modal-editar-vacina');
        if (e.target === modal) {
            fecharModalEdicaoVacina();
        }
    });

    // ===== INICIALIZAR =====
    carregarVacinas();
})();