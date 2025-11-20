(function() {
    const API_BASE = "http://localhost:8080/api/v1";
    const token = localStorage.getItem("token");
    const urlParams = new URLSearchParams(window.location.search);
    const cpf = urlParams.get('cpf');

    // Variáveis globais
    let todasVacinacoes = [];
    let vacinacoesFiltradasAtual = [];
    let paginaAtual = 1;
    const ITENS_POR_PAGINA = 5;
    let pessoaAtual = null; // Para armazenar dados do paciente

    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "login.html";
        return;
    }

    if (!cpf) {
        alert("CPF do paciente não fornecido.");
        window.location.href = "home.html";
        return;
    }

    // ===== FUNÇÕES AUXILIARES =====
    function formatCpf(cpf) {
        if (!cpf || cpf.length !== 11) return cpf;
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        if (dateString.includes('/')) {
            return dateString;
        }
        
        if (dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts;
                const dayOnly = day.split('T')[0];
                return `${dayOnly}/${month}/${year}`;
            }
        }
        
        return dateString;
    }

    function formatDateToInput(dateString) {
        if (!dateString || dateString === 'N/A' || dateString === 'Não há próxima dose agendada') return '';
        
        if (dateString.includes('/')) {
            const [day, month, year] = dateString.split('/');
            return `${year}-${month}-${day}`;
        }
        
        if (dateString.includes('-')) {
            return dateString.split('T')[0];
        }
        
        return '';
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

    // ===== MODAL DE EDIÇÃO =====
    window.abrirModalEdicao = function(vacinacao) {
        console.log("📝 Abrindo modal de edição:", vacinacao);
        
        document.getElementById('edit-vacinacao-uuid').value = vacinacao.uuid;
        document.getElementById('edit-vacina-nome').value = vacinacao.vacina?.nome || 'N/A';
        
        const dataAplicacao = formatDateToInput(vacinacao.dataAplicacao);
        document.getElementById('edit-data-aplicacao').value = dataAplicacao;
        
        const dataProxima = formatDateToInput(vacinacao.dataProximaDose);
        document.getElementById('edit-data-proxima-dose').value = dataProxima;
        
        document.getElementById('modal-editar-vacinacao').style.display = 'flex';
    };

    window.fecharModalEdicao = function() {
        document.getElementById('modal-editar-vacinacao').style.display = 'none';
        document.getElementById('form-editar-vacinacao').reset();
    };

    // ===== MODAL DE EDIÇÃO DE PACIENTE =====
    window.abrirModalEdicaoPaciente = function() {
        if (!pessoaAtual) {
            alert("Erro: Dados do paciente não disponíveis.");
            return;
        }

        console.log("📝 Abrindo modal de edição do paciente:", pessoaAtual);
        
        // Verificar se os elementos existem antes de tentar acessá-los
        const elemUuid = document.getElementById('edit-paciente-uuid');
        const elemNome = document.getElementById('edit-paciente-nome-completo');
        const elemCpf = document.getElementById('edit-paciente-cpf');
        const elemDataNasc = document.getElementById('edit-paciente-data-nascimento');
        const elemSexo = document.getElementById('edit-paciente-sexo');
        const elemCns = document.getElementById('edit-paciente-cns');
        const elemEtnia = document.getElementById('edit-paciente-etnia');
        const elemComunidade = document.getElementById('edit-paciente-comunidade');
        const elemComorbidade = document.getElementById('edit-paciente-comorbidade');

        if (!elemUuid || !elemNome || !elemCpf || !elemDataNasc || !elemSexo || 
            !elemCns || !elemEtnia || !elemComunidade || !elemComorbidade) {
            console.error("❌ Erro: Um ou mais elementos do modal não foram encontrados");
            alert("Erro ao abrir o modal. Por favor, recarregue a página.");
            return;
        }

        // Preencher os campos
        elemUuid.value = pessoaAtual.uuid;
        elemNome.value = pessoaAtual.nomeCompleto || '';
        
        // Aplicar máscara no CPF
        const cpfFormatado = formatCpf(pessoaAtual.cpf);
        elemCpf.value = cpfFormatado || '';
        
        // Formatar data para input
        const dataNasc = formatDateToInput(pessoaAtual.dataNascimento);
        elemDataNasc.value = dataNasc;
        
        elemSexo.value = pessoaAtual.sexo || '';
        elemCns.value = pessoaAtual.cns || '';
        elemEtnia.value = pessoaAtual.etnia || '';
        elemComunidade.value = pessoaAtual.comunidade || '';
        elemComorbidade.value = pessoaAtual.comorbidade || '';
        
        console.log("✅ Campos preenchidos com sucesso");
        
        document.getElementById('modal-editar-paciente').style.display = 'flex';
    };

    window.fecharModalEdicaoPaciente = function() {
        document.getElementById('modal-editar-paciente').style.display = 'none';
        document.getElementById('form-editar-paciente').reset();
    };

    // Fechar modal ao clicar fora
    document.addEventListener('click', function(e) {
        const modalVacinacao = document.getElementById('modal-editar-vacinacao');
        const modalPaciente = document.getElementById('modal-editar-paciente');
        
        if (e.target === modalVacinacao) {
            fecharModalEdicao();
        }
        if (e.target === modalPaciente) {
            fecharModalEdicaoPaciente();
        }
    });

    // ===== FUNÇÃO PARA EDITAR VACINAÇÃO =====
    document.getElementById('form-editar-vacinacao').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const vacinacaoUuid = document.getElementById('edit-vacinacao-uuid').value;
        const dataAplicacaoInput = document.getElementById('edit-data-aplicacao').value;
        const dataProximaDoseInput = document.getElementById('edit-data-proxima-dose').value;

        if (!dataAplicacaoInput) {
            alert("A data de aplicação é obrigatória.");
            return;
        }

        const dataAplicacao = formatDateToDDMMYYYY(dataAplicacaoInput);
        const dataProximaDose = dataProximaDoseInput ? formatDateToDDMMYYYY(dataProximaDoseInput) : null;

        // Buscar a vacinação completa para pegar os UUIDs
        const vacinacaoOriginal = todasVacinacoes.find(v => v.uuid === vacinacaoUuid);
        
        if (!vacinacaoOriginal) {
            alert("Erro ao localizar a vacinação.");
            return;
        }

        const payload = {
            pessoaUuid: vacinacaoOriginal.pessoa.uuid,
            vacinaUuid: vacinacaoOriginal.vacina.uuid,
            dataAplicacao: dataAplicacao,
            dataProximaDose: dataProximaDose
        };

        console.log("📤 Atualizando vacinação:", payload);

        try {
            const response = await fetch(`${API_BASE}/vacinacoes/${vacinacaoUuid}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Vacinação atualizada com sucesso!");
                fecharModalEdicao();
                // Recarregar os dados
                await buscarEExibirPaciente();
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Erro ao atualizar vacinação: ${errorData.mensagem || response.statusText}`);
            }
        } catch (error) {
            console.error("❌ Erro ao atualizar vacinação:", error);
            alert("Erro ao conectar com o servidor.");
        }
    });

    // ===== FUNÇÃO PARA EDITAR PACIENTE =====
    document.getElementById('form-editar-paciente').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const pacienteUuidElem = document.getElementById('edit-paciente-uuid');
        const nomeCompletoElem = document.getElementById('edit-paciente-nome-completo');
        const cpfInputElem = document.getElementById('edit-paciente-cpf');
        const dataNascimentoInputElem = document.getElementById('edit-paciente-data-nascimento');
        const sexoElem = document.getElementById('edit-paciente-sexo');
        const cnsElem = document.getElementById('edit-paciente-cns');
        const etniaElem = document.getElementById('edit-paciente-etnia');
        const comunidadeElem = document.getElementById('edit-paciente-comunidade');
        const comorbidadeElem = document.getElementById('edit-paciente-comorbidade');

        // Verificar se todos os elementos existem
        if (!pacienteUuidElem || !nomeCompletoElem || !cpfInputElem || !dataNascimentoInputElem || 
            !sexoElem || !cnsElem || !etniaElem || !comunidadeElem || !comorbidadeElem) {
            console.error("❌ Erro: Um ou mais elementos do formulário não foram encontrados");
            alert("Erro ao acessar os campos do formulário. Por favor, recarregue a página.");
            return;
        }

        const pacienteUuid = pacienteUuidElem.value;
        const nomeCompleto = nomeCompletoElem.value.trim();
        
        // CPF e CNS são readonly, então usamos os valores originais do pessoaAtual
        const cpf = pessoaAtual.cpf; // Usar valor original
        const cns = pessoaAtual.cns; // Usar valor original
        
        const dataNascimentoInput = dataNascimentoInputElem.value;
        const sexo = sexoElem.value;
        const etnia = etniaElem.value.trim();
        const comunidade = comunidadeElem.value.trim();
        const comorbidade = comorbidadeElem.value.trim();

        // Validações
        if (!nomeCompleto || !cpf || !dataNascimentoInput || !sexo || !cns || !etnia || !comunidade) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        if (cpf.length !== 11) {
            alert("CPF inválido.");
            return;
        }

        if (cns.length !== 15) {
            alert("CNS inválido.");
            return;
        }

        // Converter data para dd/MM/yyyy
        const dataNascimento = formatDateToDDMMYYYY(dataNascimentoInput);

        const payload = {
            nomeCompleto,
            cpf,
            sexo,
            dataNascimento,
            comorbidade: comorbidade || "Nenhuma",
            etnia,
            cns,
            comunidade
        };

        console.log("📤 Atualizando paciente:", payload);

        try {
            const response = await fetch(`${API_BASE}/pessoa/${pacienteUuid}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Informações do paciente atualizadas com sucesso!");
                fecharModalEdicaoPaciente();
                // Recarregar os dados
                await buscarEExibirPaciente();
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Erro ao atualizar paciente: ${errorData.mensagem || response.statusText}`);
            }
        } catch (error) {
            console.error("❌ Erro ao atualizar paciente:", error);
            alert("Erro ao conectar com o servidor.");
        }
    });

    // ===== FUNÇÃO PARA DELETA PACIENTE =====
    window.excluirPaciente = async function () {
        // Verificar se há dados do paciente
        if (!pessoaAtual) {
            alert("❌ Erro: Dados do paciente não disponíveis.");
            return;
        }

        console.log("🗑️ Iniciando processo de exclusão do paciente:", pessoaAtual.nomeCompleto);

        // ===== PRIMEIRA CONFIRMAÇÃO =====
        const confirmacao1 = confirm(
            `⚠️ ATENÇÃO: Exclusão de Paciente\n\n` +
            `Tem certeza que deseja excluir o paciente "${pessoaAtual.nomeCompleto}"?\n\n` +
            `CPF: ${formatCpf(pessoaAtual.cpf)}\n\n` +
            `Esta ação irá remover permanentemente todos os dados do paciente.`
        );

        if (!confirmacao1) {
            console.log("❌ Exclusão cancelada pelo usuário (1ª confirmação)");
            return;
        }

        // ===== SEGUNDA CONFIRMAÇÃO (Segurança Extra) =====
        const confirmacao2 = confirm(
            `🚨 ÚLTIMA CONFIRMAÇÃO\n\n` +
            `Esta ação NÃO PODE SER DESFEITA!\n\n` +
            `Deseja realmente excluir o paciente "${pessoaAtual.nomeCompleto}"?\n\n` +
            `Clique em OK para confirmar a exclusão.`
        );

        if (!confirmacao2) {
            console.log("❌ Exclusão cancelada pelo usuário (2ª confirmação)");
            return;
        }

        // ===== VERIFICAR PERMISSÃO =====
        const token = localStorage.getItem("token");
        if (!token) {
            alert("❌ Você precisa estar logado para excluir um paciente.");
            window.location.href = "login.html";
            return;
        }

        // Verificar se é ADMIN
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role = payload?.role;

            if (role !== 'ADMIN') {
                alert(
                    "⚠️ ACESSO NEGADO\n\n" +
                    "Apenas usuários com perfil ADMIN podem excluir pacientes.\n\n" +
                    "Esta ação requer permissões administrativas."
                );
                console.log("🚫 Usuário não é ADMIN - exclusão negada");
                return;
            }

            console.log("✅ Usuário é ADMIN - prosseguindo com exclusão");

        } catch (e) {
            console.error("❌ Erro ao verificar permissões:", e);
            alert("Erro ao verificar permissões. Faça login novamente.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        // ===== EXECUTAR EXCLUSÃO =====
        try {
            console.log("🔄 Enviando requisição de exclusão para o backend...");
            console.log("UUID do paciente:", pessoaAtual.uuid);

            const response = await fetch(`${API_BASE}/pessoa/${pessoaAtual.uuid}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            console.log("📥 Status da resposta:", response.status);

            // ✅ SUCESSO (204 No Content ou 200 OK)
            if (response.ok || response.status === 204) {
                console.log("✅ Paciente excluído com sucesso");

                // Limpar dados do localStorage
                localStorage.removeItem("pacienteSelecionado");

                // Mostrar mensagem de sucesso
                alert(
                    "✅ Paciente Excluído com Sucesso\n\n" +
                    `O paciente "${pessoaAtual.nomeCompleto}" foi removido do sistema.\n\n` +
                    `Você será redirecionado para a página inicial.`
                );

                // Redirecionar para home após 1 segundo
                setTimeout(() => {
                    window.location.href = "home.html";
                }, 1000);

            }
            // ❌ ERRO 403 - Sem permissão
            else if (response.status === 403) {
                console.error("❌ Erro 403 - Acesso negado");
                alert(
                    "⚠️ ACESSO NEGADO\n\n" +
                    "Você não tem permissão para excluir pacientes.\n\n" +
                    "Apenas administradores podem realizar esta ação."
                );
            }
            // ❌ ERRO 404 - Paciente não encontrado
            else if (response.status === 404) {
                console.error("❌ Erro 404 - Paciente não encontrado");
                alert(
                    "⚠️ Paciente Não Encontrado\n\n" +
                    "O paciente pode já ter sido excluído ou não existe mais no sistema.\n\n" +
                    "Você será redirecionado para a página inicial."
                );
                setTimeout(() => {
                    window.location.href = "home.html";
                }, 2000);
            }
            // ❌ OUTROS ERROS
            else {
                const errorData = await response.json().catch(() => ({}));
                console.error("❌ Erro ao excluir:", errorData);

                const mensagemErro = errorData.mensagem || errorData.message || response.statusText;
                alert(
                    `❌ Erro ao Excluir Paciente\n\n` +
                    `${mensagemErro}\n\n` +
                    `Status: ${response.status}\n\n` +
                    `Por favor, tente novamente ou entre em contato com o suporte.`
                );
            }

        } catch (error) {
            // ❌ ERRO DE CONEXÃO
            console.error("❌ Erro ao conectar com o servidor:", error);
            alert(
                "❌ Erro de Conexão\n\n" +
                "Não foi possível conectar com o servidor.\n\n" +
                "Verifique sua conexão com a internet e tente novamente."
            );
        }
    };

    /**
     * Verifica se o usuário é ADMIN e controla a visibilidade do botão de excluir
     */
    function controlarVisibilidadeBotaoExcluir() {
        const btnExcluir = document.querySelector('.btn-delete-info');

        if (!btnExcluir) {
            console.warn("⚠️ Botão de excluir não encontrado no DOM");
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            console.log("🚫 Sem token - ocultando botão de excluir");
            btnExcluir.style.display = 'none';
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role = payload?.role;

            if (role === 'ADMIN') {
                console.log("✅ Usuário é ADMIN - exibindo botão de excluir");
                btnExcluir.style.display = 'inline-flex';
            } else {
                console.log("🚫 Usuário não é ADMIN - ocultando botão de excluir");
                btnExcluir.style.display = 'none';
            }
        } catch (e) {
            console.error("❌ Erro ao verificar role do usuário:", e);
            btnExcluir.style.display = 'none';
        }
    }


    // ===== FUNÇÃO PARA EXCLUIR VACINAÇÃO =====
    window.excluirVacinacao = async function(uuid, nomeVacina) {
        const confirmacao = confirm(
            `Tem certeza que deseja excluir o registro da vacina "${nomeVacina}"?\n\n` +
            `Esta ação não pode ser desfeita.`
        );

        if (!confirmacao) return;

        console.log("🗑️ Excluindo vacinação:", uuid);

        try {
            const response = await fetch(`${API_BASE}/vacinacoes/${uuid}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok || response.status === 204) {
                alert("Vacinação excluída com sucesso!");
                // Recarregar os dados
                await buscarEExibirPaciente();
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Erro ao excluir vacinação: ${errorData.mensagem || response.statusText}`);
            }
        } catch (error) {
            console.error("❌ Erro ao excluir vacinação:", error);
            alert("Erro ao conectar com o servidor.");
        }
    };

    // ===== PAGINAÇÃO =====
    function criarPaginacao(totalItens) {
        const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA);
        
        const paginacaoExistente = document.querySelector('.paginacao-container');
        if (paginacaoExistente) {
            paginacaoExistente.remove();
        }

        if (totalPaginas <= 1) {
            return;
        }

        const historicoCard = document.querySelector('.historico-card');
        const paginacaoContainer = document.createElement('div');
        paginacaoContainer.className = 'paginacao-container';
        paginacaoContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid var(--border-color);
        `;

        const info = document.createElement('div');
        info.className = 'paginacao-info';
        info.style.cssText = 'color: var(--text-secondary); font-size: 0.9rem;';
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA + 1;
        const fim = Math.min(paginaAtual * ITENS_POR_PAGINA, totalItens);
        info.textContent = `Mostrando ${inicio} a ${fim} de ${totalItens} vacinações`;

        const botoesContainer = document.createElement('div');
        botoesContainer.className = 'paginacao-botoes';
        botoesContainer.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';

        const btnAnterior = document.createElement('button');
        btnAnterior.className = 'btn-paginacao';
        btnAnterior.innerHTML = '<i class="fa-solid fa-chevron-left"></i> Anterior';
        btnAnterior.disabled = paginaAtual === 1;
        btnAnterior.style.cssText = `
            padding: 0.5rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background-color: ${paginaAtual === 1 ? 'var(--background-color)' : 'var(--card-background)'};
            color: ${paginaAtual === 1 ? 'var(--text-secondary)' : 'var(--text-primary)'};
            cursor: ${paginaAtual === 1 ? 'not-allowed' : 'pointer'};
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        if (paginaAtual > 1) {
            btnAnterior.onmouseover = () => {
                btnAnterior.style.backgroundColor = 'var(--background-color)';
                btnAnterior.style.borderColor = 'var(--primary-blue)';
            };
            btnAnterior.onmouseout = () => {
                btnAnterior.style.backgroundColor = 'var(--card-background)';
                btnAnterior.style.borderColor = 'var(--border-color)';
            };
        }
        btnAnterior.addEventListener('click', () => {
            if (paginaAtual > 1) {
                paginaAtual--;
                renderizarHistoricoVacinal(vacinacoesFiltradasAtual);
            }
        });

        const paginasNumeros = document.createElement('div');
        paginasNumeros.style.cssText = 'display: flex; gap: 0.3rem;';

        for (let i = 1; i <= totalPaginas; i++) {
            const btnPagina = document.createElement('button');
            btnPagina.textContent = i;
            btnPagina.className = 'btn-pagina-numero';
            const isAtiva = i === paginaAtual;
            btnPagina.style.cssText = `
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
                btnPagina.onmouseover = () => {
                    btnPagina.style.backgroundColor = 'var(--background-color)';
                    btnPagina.style.borderColor = 'var(--primary-blue)';
                };
                btnPagina.onmouseout = () => {
                    btnPagina.style.backgroundColor = 'var(--card-background)';
                    btnPagina.style.borderColor = 'var(--border-color)';
                };
            }
            btnPagina.addEventListener('click', () => {
                paginaAtual = i;
                renderizarHistoricoVacinal(vacinacoesFiltradasAtual);
            });
            paginasNumeros.appendChild(btnPagina);
        }

        const btnProximo = document.createElement('button');
        btnProximo.className = 'btn-paginacao';
        btnProximo.innerHTML = 'Próximo <i class="fa-solid fa-chevron-right"></i>';
        btnProximo.disabled = paginaAtual === totalPaginas;
        btnProximo.style.cssText = `
            padding: 0.5rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background-color: ${paginaAtual === totalPaginas ? 'var(--background-color)' : 'var(--card-background)'};
            color: ${paginaAtual === totalPaginas ? 'var(--text-secondary)' : 'var(--text-primary)'};
            cursor: ${paginaAtual === totalPaginas ? 'not-allowed' : 'pointer'};
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        if (paginaAtual < totalPaginas) {
            btnProximo.onmouseover = () => {
                btnProximo.style.backgroundColor = 'var(--background-color)';
                btnProximo.style.borderColor = 'var(--primary-blue)';
            };
            btnProximo.onmouseout = () => {
                btnProximo.style.backgroundColor = 'var(--card-background)';
                btnProximo.style.borderColor = 'var(--border-color)';
            };
        }
        btnProximo.addEventListener('click', () => {
            if (paginaAtual < totalPaginas) {
                paginaAtual++;
                renderizarHistoricoVacinal(vacinacoesFiltradasAtual);
            }
        });

        botoesContainer.appendChild(btnAnterior);
        botoesContainer.appendChild(paginasNumeros);
        botoesContainer.appendChild(btnProximo);

        paginacaoContainer.appendChild(info);
        paginacaoContainer.appendChild(botoesContainer);

        historicoCard.appendChild(paginacaoContainer);
    }

    // ===== FILTRO =====
    function filtrarVacinacoes() {
        const filtroInput = document.getElementById('filtro-vacina');
        const filtroTexto = normalizeText(filtroInput.value.trim());
        const resultadoDiv = document.getElementById('resultado-filtro');
        const btnLimpar = document.getElementById('limpar-filtro');

        if (filtroTexto.length > 0) {
            btnLimpar.style.display = 'flex';
        } else {
            btnLimpar.style.display = 'none';
        }

        if (filtroTexto.length === 0) {
            vacinacoesFiltradasAtual = [...todasVacinacoes];
            resultadoDiv.textContent = '';
            resultadoDiv.className = 'resultado-filtro';
            paginaAtual = 1;
            renderizarHistoricoVacinal(vacinacoesFiltradasAtual);
            return;
        }

        vacinacoesFiltradasAtual = todasVacinacoes.filter(vac => {
            const nomeVacina = normalizeText(vac.vacina?.nome || '');
            return nomeVacina.includes(filtroTexto);
        });

        if (vacinacoesFiltradasAtual.length > 0) {
            resultadoDiv.textContent = `${vacinacoesFiltradasAtual.length} vacinação(ões) encontrada(s)`;
            resultadoDiv.className = 'resultado-filtro tem-resultados';
        } else {
            resultadoDiv.textContent = 'Nenhuma vacinação encontrada com esse nome';
            resultadoDiv.className = 'resultado-filtro sem-resultados';
        }

        paginaAtual = 1;
        renderizarHistoricoVacinal(vacinacoesFiltradasAtual);
    }

    function limparFiltro() {
        const filtroInput = document.getElementById('filtro-vacina');
        filtroInput.value = '';
        filtrarVacinacoes();
        filtroInput.focus();
    }

    // ===== RENDERIZAR TABELA =====
    function renderizarHistoricoVacinal(vacinacoes) {
        const tbody = document.getElementById('historico-vacinacao-body');
        const msgVazio = document.getElementById('historico-vacinacao-vazio');
        
        if (vacinacoes.length === 0) {
            tbody.innerHTML = '';
            msgVazio.style.display = 'block';
            
            const paginacaoExistente = document.querySelector('.paginacao-container');
            if (paginacaoExistente) {
                paginacaoExistente.remove();
            }
            return;
        }

        tbody.innerHTML = '';
        msgVazio.style.display = 'none';

        const vacinacoesOrdenadas = [...vacinacoes].sort((a, b) => {
            const dataA = new Date(a.dataAplicacao.split('/').reverse().join('-'));
            const dataB = new Date(b.dataAplicacao.split('/').reverse().join('-'));
            return dataB - dataA;
        });

        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        const fim = inicio + ITENS_POR_PAGINA;
        const vacinacoesPaginadas = vacinacoesOrdenadas.slice(inicio, fim);

        vacinacoesPaginadas.forEach(vacinacao => {
            const row = tbody.insertRow();
            
            row.insertCell().textContent = vacinacao.vacina?.nome || 'N/A';
            row.insertCell().textContent = formatDate(vacinacao.dataAplicacao) || 'N/A';
            
            const proximaDose = vacinacao.dataProximaDose 
                ? formatDate(vacinacao.dataProximaDose) 
                : 'Não há próxima dose agendada';
            row.insertCell().textContent = proximaDose;
            
            row.insertCell().textContent = vacinacao.vacina?.numeroLote || 'N/A';
            
            const fabricante = vacinacao.vacina?.fabricante || 'N/A';
            const fabricanteFormatado = fabricante.replace(/_/g, ' ')
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            row.insertCell().textContent = fabricanteFormatado;

            // ✅ NOVA CÉLULA COM BOTÕES DE AÇÃO
            const cellAcoes = row.insertCell();
            cellAcoes.style.textAlign = 'center';
            
            const actionButtonsDiv = document.createElement('div');
            actionButtonsDiv.className = 'action-buttons-cell';
            
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-action btn-edit';
            btnEditar.innerHTML = '<i class="fa-solid fa-edit"></i> Editar';
            btnEditar.title = 'Editar vacinação';
            btnEditar.onclick = () => abrirModalEdicao(vacinacao);
            
            const btnExcluir = document.createElement('button');
            btnExcluir.className = 'btn-action btn-delete';
            btnExcluir.innerHTML = '<i class="fa-solid fa-trash"></i> Excluir';
            btnExcluir.title = 'Excluir vacinação';
            btnExcluir.onclick = () => excluirVacinacao(vacinacao.uuid, vacinacao.vacina?.nome || 'esta vacina');
            
            actionButtonsDiv.appendChild(btnEditar);
            actionButtonsDiv.appendChild(btnExcluir);
            cellAcoes.appendChild(actionButtonsDiv);
        });

        criarPaginacao(vacinacoesOrdenadas.length);
        console.log("✅ Histórico vacinal renderizado - Página", paginaAtual);
    }

    // ===== BUSCAR DADOS DO PACIENTE =====
    async function buscarEExibirPaciente() {
        try {
            console.log("🔍 Buscando paciente com CPF:", cpf);
            
            const respPessoa = await fetch(`${API_BASE}/pessoa/buscar-por-cpf`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ cpf: cpf }),
            });

            if (!respPessoa.ok) {
                const data = await respPessoa.json().catch(() => ({}));
                alert(data?.mensagem || "Paciente não encontrado.");
                window.location.href = "home.html";
                return;
            }

            const rawPessoa = await respPessoa.json();
            
            let pessoa = null;
            if (rawPessoa?.dados) {
                if (Array.isArray(rawPessoa.dados)) {
                    pessoa = rawPessoa.dados[0];
                } else {
                    pessoa = rawPessoa.dados;
                }
            } else {
                pessoa = rawPessoa;
            }

            if (!pessoa || !pessoa.uuid) {
                alert("Dados do paciente incompletos.");
                window.location.href = "home.html";
                return;
            }

            pessoaAtual = pessoa; // Armazenar globalmente

            // Exibir dados pessoais
            document.getElementById('nome-completo').textContent = pessoa.nomeCompleto || 'N/A';
            document.getElementById('cpf').textContent = formatCpf(pessoa.cpf) || 'N/A';
            document.getElementById('data-nascimento').textContent = formatDate(pessoa.dataNascimento) || 'N/A';
            document.getElementById('sexo').textContent = pessoa.sexo || 'N/A';
            document.getElementById('cns').textContent = pessoa.cns || 'N/A';
            document.getElementById('etnia').textContent = pessoa.etnia || 'N/A';
            document.getElementById('comunidade').textContent = pessoa.comunidade || 'N/A';
            document.getElementById('comorbidade').textContent = pessoa.comorbidade || 'Nenhuma';

            // Buscar histórico vacinal
            try {
                const respVacinacoes = await fetch(`${API_BASE}/vacinacoes?size=1000&page=0`, {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${token}` },
                });

                if (!respVacinacoes.ok) {
                    renderizarHistoricoVacinal([]);
                    return;
                }

                const rawVacinacoes = await respVacinacoes.json();
                
                let vacinacoes = [];
                if (rawVacinacoes?.dados) {
                    if (Array.isArray(rawVacinacoes.dados[0])) {
                        vacinacoes = rawVacinacoes.dados[0];
                    } else {
                        vacinacoes = rawVacinacoes.dados;
                    }
                }

                const vacinacoesCompletas = [];
                
                for (const vac of vacinacoes) {
                    try {
                        const respDetalhe = await fetch(`${API_BASE}/vacinacoes/${vac.uuid}`, {
                            method: "GET",
                            headers: { "Authorization": `Bearer ${token}` },
                        });

                        if (respDetalhe.ok) {
                            const detalheRaw = await respDetalhe.json();
                            
                            let detalhe = null;
                            if (detalheRaw?.dados) {
                                if (Array.isArray(detalheRaw.dados)) {
                                    detalhe = detalheRaw.dados[0];
                                } else {
                                    detalhe = detalheRaw.dados;
                                }
                            } else {
                                detalhe = detalheRaw;
                            }

                            if (detalhe && detalhe.pessoa && detalhe.pessoa.uuid === pessoa.uuid) {
                                vacinacoesCompletas.push(detalhe);
                            }
                        }
                    } catch (err) {
                        console.warn("❌ Erro ao buscar detalhe:", err);
                    }
                }

                todasVacinacoes = vacinacoesCompletas;
                vacinacoesFiltradasAtual = [...vacinacoesCompletas];
                renderizarHistoricoVacinal(vacinacoesCompletas);

            } catch (err) {
                console.error("❌ Erro ao buscar histórico:", err);
                renderizarHistoricoVacinal([]);
            }

            // Configurar botão de registrar
            const btnRegistrar = document.getElementById('btn-registrar-vacinacao');
            if (btnRegistrar) {
                btnRegistrar.addEventListener('click', () => {
                    localStorage.setItem("pacienteSelecionado", JSON.stringify(pessoa));
                    window.location.href = `registrar-vacinacao.html?cpf=${pessoa.cpf}`;
                });
            }

        } catch (err) {
            console.error("❌ Erro geral:", err);
            alert("Falha ao buscar dados do paciente.");
            window.location.href = "home.html";
        }
    }

    // ===== CONFIGURAR EVENTOS =====
    const btnVoltar = document.querySelector('a[href="home.html"]');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem("pacienteSelecionado");
            window.location.href = "home.html";
        });
    }

    const filtroInput = document.getElementById('filtro-vacina');
    const btnLimpar = document.getElementById('limpar-filtro');

    if (filtroInput) {
        let debounceTimer;
        filtroInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filtrarVacinacoes, 300);
        });

        filtroInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                filtrarVacinacoes();
            }
        });
    }

    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparFiltro);
    }

    // Iniciar a busca
    buscarEExibirPaciente();
})();