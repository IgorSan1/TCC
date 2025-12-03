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
    let pessoaAtual = null;

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

    // ===== FUNÇÃO PARA DECODIFICAR JWT =====
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

    // ===== ✅ CONTROLE DE VISIBILIDADE DO BOTÃO DE EXCLUIR =====
    function controlarVisibilidadeBotaoExcluir() {
        console.log("🔐 Verificando permissões para o botão de excluir...");
        
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
            const payload = decodeJWT(token);
            const role = payload?.role;

            console.log("👤 Role do usuário:", role);

            if (role === 'ADMIN' || role === 'USER') {
                console.log("✅ Usuário possui permissão para exclusão - exibindo botão de excluir (role:", role, ")");
                btnExcluir.style.display = 'inline-flex';
            } else {
                console.log("🚫 Usuário sem permissão para exclusão - ocultando botão de excluir (role:", role, ")");
                btnExcluir.style.display = 'none';
            }
        } catch (e) {
            console.error("❌ Erro ao verificar role do usuário:", e);
            btnExcluir.style.display = 'none';
        }
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

        elemUuid.value = pessoaAtual.uuid;
        elemNome.value = pessoaAtual.nomeCompleto || '';
        
        const cpfFormatado = formatCpf(pessoaAtual.cpf);
        elemCpf.value = cpfFormatado || '';
        
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

        if (!pacienteUuidElem || !nomeCompletoElem || !cpfInputElem || !dataNascimentoInputElem || 
            !sexoElem || !cnsElem || !etniaElem || !comunidadeElem || !comorbidadeElem) {
            console.error("❌ Erro: Um ou mais elementos do formulário não foram encontrados");
            alert("Erro ao acessar os campos do formulário. Por favor, recarregue a página.");
            return;
        }

        const pacienteUuid = pacienteUuidElem.value;
        const nomeCompleto = nomeCompletoElem.value.trim();
        
        const cpf = pessoaAtual.cpf;
        const cns = pessoaAtual.cns;
        
        const dataNascimentoInput = dataNascimentoInputElem.value;
        const sexo = sexoElem.value;
        const etnia = etniaElem.value.trim();
        const comunidade = comunidadeElem.value.trim();
        const comorbidade = comorbidadeElem.value.trim();

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

    // ===== ✅ FUNÇÃO COMPLETA PARA DELETAR PACIENTE =====
    window.excluirPaciente = async function () {
        if (!pessoaAtual) {
            alert("❌ Erro: Dados do paciente não disponíveis.");
            return;
        }

        console.log("🗑️ Iniciando processo de exclusão do paciente:", pessoaAtual.nomeCompleto);

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

        const token = localStorage.getItem("token");
        if (!token) {
            alert("❌ Você precisa estar logado para excluir um paciente.");
            window.location.href = "login.html";
            return;
        }

        try {
            const payload = decodeJWT(token);
            const role = payload?.role;

            if (!(role === 'ADMIN' || role === 'USER')) {
                alert(
                    "⚠️ ACESSO NEGADO\n\n" +
                    "Você não tem permissão para excluir pacientes.\n\n" +
                    "Esta ação requer um perfil autorizado (ADMIN ou USER)."
                );
                console.log("🚫 Usuário sem permissão para exclusão - ação negada (role:", role, ")");
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

            if (response.ok || response.status === 204) {
                console.log("✅ Paciente excluído com sucesso");

                localStorage.removeItem("pacienteSelecionado");

                alert(
                    "✅ Paciente Excluído com Sucesso\n\n" +
                    `O paciente "${pessoaAtual.nomeCompleto}" foi removido do sistema.\n\n` +
                    `Você será redirecionado para a página inicial.`
                );

                setTimeout(() => {
                    window.location.href = "home.html";
                }, 1000);

            } else if (response.status === 403) {
                console.error("❌ Erro 403 - Acesso negado");
                alert(
                    "⚠️ ACESSO NEGADO\n\n" +
                    "Você não tem permissão para excluir pacientes.\n\n" +
                    "Apenas administradores podem realizar esta ação."
                );
            } else if (response.status === 404) {
                console.error("❌ Erro 404 - Paciente não encontrado");
                alert(
                    "⚠️ Paciente Não Encontrado\n\n" +
                    "O paciente pode já ter sido excluído ou não existe mais no sistema.\n\n" +
                    "Você será redirecionado para a página inicial."
                );
                setTimeout(() => {
                    window.location.href = "home.html";
                }, 2000);
            } else {
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
            console.error("❌ Erro ao conectar com o servidor:", error);
            alert(
                "❌ Erro de Conexão\n\n" +
                "Não foi possível conectar com o servidor.\n\n" +
                "Verifique sua conexão com a internet e tente novamente."
            );
        }
    };

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

    // ===== BUSCAR E EXIBIR PACIENTE =====
    async function buscarEExibirPaciente() {
        console.log("🔍 Buscando paciente por CPF:", cpf);

        try {
            const cpfLimpo = cpf.replace(/\D/g, '');
            
            const response = await fetch(`${API_BASE}/pessoa/buscar-por-cpf`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ cpf: cpfLimpo })
            });

            if (!response.ok) {
                throw new Error("Paciente não encontrado");
            }

            const data = await response.json();
            
            let pessoa = null;
            if (Array.isArray(data?.dados) && Array.isArray(data.dados[0])) {
                pessoa = data.dados[0][0];
            } else if (Array.isArray(data?.dados)) {
                pessoa = data.dados[0];
            } else if (data?.dados) {
                pessoa = data.dados;
            } else {
                pessoa = data;
            }

            if (!pessoa || !pessoa.uuid) {
                throw new Error("Dados do paciente inválidos");
            }

            pessoaAtual = pessoa;
            console.log("✅ Paciente encontrado:", pessoa);

            // Preencher informações na página
            document.getElementById('nome-completo').textContent = pessoa.nomeCompleto || 'N/A';
            document.getElementById('cpf').textContent = formatCpf(pessoa.cpf) || 'N/A';
            document.getElementById('data-nascimento').textContent = formatDate(pessoa.dataNascimento) || 'N/A';
            document.getElementById('sexo').textContent = pessoa.sexo || 'N/A';
            document.getElementById('cns').textContent = pessoa.cns || 'N/A';
            document.getElementById('etnia').textContent = pessoa.etnia || 'N/A';
            document.getElementById('comunidade').textContent = pessoa.comunidade || 'N/A';
            document.getElementById('comorbidade').textContent = pessoa.comorbidade || 'Nenhuma';

            // Buscar histórico de vacinações
            await buscarHistoricoVacinal(pessoa.uuid);
            
            controlarVisibilidadeBotaoExcluir();

        } catch (error) {
            console.error("❌ Erro ao buscar paciente:", error);
            alert("Erro ao carregar informações do paciente.");
            window.location.href = "home.html";
        }
    }

    // ===== ✅ BUSCAR HISTÓRICO VACINAL - SOLUÇÃO COM UUIDs =====
    async function buscarHistoricoVacinal(pessoaUuid) {
        console.log("💉 Buscando histórico vacinal do paciente:", pessoaUuid);

        const tbody = document.getElementById('historico-vacinacao-body');
        const msgVazio = document.getElementById('historico-vacinacao-vazio');

        if (!tbody || !msgVazio) {
            console.error("❌ Elementos da tabela não encontrados no DOM");
            return;
        }

        try {
            // ✅ BUSCAR TODAS AS VACINAÇÕES
            const response = await fetch(`${API_BASE}/vacinacoes?size=1000&page=0`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("Erro ao buscar vacinações");
            }

            const data = await response.json();
            console.log("📦 Resposta da API de vacinações:", data);
            
            let vacinacoes = [];
            if (Array.isArray(data?.dados) && Array.isArray(data.dados[0])) {
                vacinacoes = data.dados[0];
            } else if (Array.isArray(data?.dados)) {
                vacinacoes = data.dados;
            }

            console.log("📦 Total de vacinações no sistema:", vacinacoes.length);

            // ✅ Criar cache de pessoas e vacinas para performance
            const cachePessoas = {};
            const cacheVacinas = {};

            // ✅ PROCESSAR CADA VACINAÇÃO
            const vacinacoesPaciente = [];
            
            for (const v of vacinacoes) {
                try {
                    console.log(`\n🔍 Processando vacinação ${v.uuid}`);
                    
                    // Buscar detalhes completos da vacinação
                    const respDetalhe = await fetch(`${API_BASE}/vacinacoes/${v.uuid}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    
                    if (!respDetalhe.ok) {
                        console.warn(`⚠️ Erro ao buscar vacinação ${v.uuid}`);
                        continue;
                    }

                    const detalhe = await respDetalhe.json();
                    
                    let detalheDados = null;
                    if (Array.isArray(detalhe?.dados) && Array.isArray(detalhe.dados[0])) {
                        detalheDados = detalhe.dados[0][0];
                    } else if (Array.isArray(detalhe?.dados)) {
                        detalheDados = detalhe.dados[0];
                    } else if (detalhe?.dados) {
                        detalheDados = detalhe.dados;
                    } else {
                        detalheDados = detalhe;
                    }
                    
                    console.log(`📄 Detalhe da vacinação:`, detalheDados);

                    // ✅ VERIFICAR SE A API RETORNA pessoaUuid e vacinaUuid
                    const vacinacaoPessoaUuid = detalheDados.pessoaUuid || detalheDados.pessoa?.uuid;
                    const vacinacaoVacinaUuid = detalheDados.vacinaUuid || detalheDados.vacina?.uuid;

                    console.log(`🔎 Pessoa UUID da vacinação: ${vacinacaoPessoaUuid}`);
                    console.log(`🔎 Paciente UUID buscado: ${pessoaUuid}`);
                    console.log(`🔎 UUIDs são iguais? ${vacinacaoPessoaUuid === pessoaUuid}`);

                    // ✅ FILTRAR: Apenas vacinações deste paciente
                    if (vacinacaoPessoaUuid !== pessoaUuid) {
                        console.log("❌ Vacinação não pertence a este paciente");
                        continue;
                    }

                    console.log("✅ Vacinação pertence a este paciente!");

                    // ✅ BUSCAR DADOS DA PESSOA (se não estiver em cache)
                    let pessoa = cachePessoas[vacinacaoPessoaUuid];
                    if (!pessoa) {
                        try {
                            const respPessoa = await fetch(`${API_BASE}/pessoa/${vacinacaoPessoaUuid}`, {
                                headers: { "Authorization": `Bearer ${token}` }
                            });
                            
                            if (respPessoa.ok) {
                                const dataPessoa = await respPessoa.json();
                                if (Array.isArray(dataPessoa?.dados) && Array.isArray(dataPessoa.dados[0])) {
                                    pessoa = dataPessoa.dados[0][0];
                                } else if (Array.isArray(dataPessoa?.dados)) {
                                    pessoa = dataPessoa.dados[0];
                                } else if (dataPessoa?.dados) {
                                    pessoa = dataPessoa.dados;
                                }
                                cachePessoas[vacinacaoPessoaUuid] = pessoa;
                                console.log("👤 Pessoa carregada:", pessoa?.nomeCompleto);
                            }
                        } catch (err) {
                            console.warn("⚠️ Erro ao buscar pessoa:", err);
                        }
                    }

                    // ✅ BUSCAR DADOS DA VACINA (se não estiver em cache)
                    let vacina = cacheVacinas[vacinacaoVacinaUuid];
                    if (!vacina) {
                        try {
                            const respVacina = await fetch(`${API_BASE}/vacina/${vacinacaoVacinaUuid}`, {
                                headers: { "Authorization": `Bearer ${token}` }
                            });
                            
                            if (respVacina.ok) {
                                const dataVacina = await respVacina.json();
                                if (Array.isArray(dataVacina?.dados) && Array.isArray(dataVacina.dados[0])) {
                                    vacina = dataVacina.dados[0][0];
                                } else if (Array.isArray(dataVacina?.dados)) {
                                    vacina = dataVacina.dados[0];
                                } else if (dataVacina?.dados) {
                                    vacina = dataVacina.dados;
                                }
                                cacheVacinas[vacinacaoVacinaUuid] = vacina;
                                console.log("💉 Vacina carregada:", vacina?.nome);
                            }
                        } catch (err) {
                            console.warn("⚠️ Erro ao buscar vacina:", err);
                        }
                    }

                    // ✅ MONTAR OBJETO COMPLETO DA VACINAÇÃO
                    const vacinacaoCompleta = {
                        uuid: detalheDados.uuid || v.uuid,
                        dataAplicacao: detalheDados.dataAplicacao || v.dataAplicacao,
                        dataProximaDose: detalheDados.dataProximaDose || v.dataProximaDose,
                        pessoa: pessoa || { nomeCompleto: 'Desconhecido', cpf: 'N/A' },
                        vacina: vacina || { nome: 'Vacina não identificada', numeroLote: 'N/A', fabricante: 'N/A' }
                    };

                    vacinacoesPaciente.push(vacinacaoCompleta);
                    console.log("✅ Vacinação completa adicionada:", vacinacaoCompleta);

                } catch (err) {
                    console.warn("⚠️ Erro ao processar vacinação:", err);
                }
            }

            todasVacinacoes = vacinacoesPaciente;
            vacinacoesFiltradasAtual = [...vacinacoesPaciente];
            
            console.log(`✅ ${vacinacoesPaciente.length} vacinações encontradas para o paciente`);
            console.log("📊 Vacinações do paciente (completas):", vacinacoesPaciente);

            renderizarHistoricoVacinal(vacinacoesPaciente);

        } catch (error) {
            console.error("❌ Erro ao buscar histórico vacinal:", error);
            tbody.innerHTML = '';
            msgVazio.style.display = 'block';
            msgVazio.textContent = 'Erro ao carregar histórico de vacinações.';
        }
    }

    // ===== ✅ RENDERIZAR HISTÓRICO VACINAL - CORRIGIDO =====
    function renderizarHistoricoVacinal(vacinacoes) {
        const tbody = document.getElementById('historico-vacinacao-body');
        const msgVazio = document.getElementById('historico-vacinacao-vazio');

        console.log("🎨 Renderizando histórico vacinal...");
        console.log("📊 Quantidade de vacinações:", vacinacoes.length);

        // ✅ GARANTIR QUE OS ELEMENTOS EXISTAM
        if (!tbody || !msgVazio) {
            console.error("❌ Elementos da tabela não encontrados no DOM");
            return;
        }

        // ✅ LIMPAR TABELA SEMPRE
        tbody.innerHTML = '';

        // ✅ VERIFICAR SE NÃO HÁ VACINAÇÕES
        if (!vacinacoes || vacinacoes.length === 0) {
            console.log("ℹ️ Nenhuma vacinação encontrada - exibindo mensagem");
            msgVazio.style.display = 'block';
            msgVazio.textContent = 'Nenhuma vacinação registrada para este paciente.';
            removerPaginacao();
            return;
        }

        // ✅ HÁ VACINAÇÕES - OCULTAR MENSAGEM E RENDERIZAR
        console.log("✅ Vacinações encontradas - renderizando tabela");
        msgVazio.style.display = 'none';

        // Ordenar por data de aplicação (mais recente primeiro)
        const vacinacoesOrdenadas = [...vacinacoes].sort((a, b) => {
            const dataA = converterParaDate(a.dataAplicacao);
            const dataB = converterParaDate(b.dataAplicacao);
            return dataB - dataA;
        });

        // Paginação
        const totalPaginas = Math.ceil(vacinacoesOrdenadas.length / ITENS_POR_PAGINA);
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        const fim = inicio + ITENS_POR_PAGINA;
        const vacinacoesPaginadas = vacinacoesOrdenadas.slice(inicio, fim);

        vacinacoesPaginadas.forEach(v => {
            const row = tbody.insertRow();

            // Vacina
            row.insertCell().textContent = v.vacina?.nome || 'N/A';

            // Data Aplicação
            row.insertCell().textContent = formatDate(v.dataAplicacao);

            // Próxima Dose
            row.insertCell().textContent = v.dataProximaDose ? formatDate(v.dataProximaDose) : 'Não há próxima dose agendada';

            // Lote
            row.insertCell().textContent = v.vacina?.numeroLote || 'N/A';

            // Fabricante
            row.insertCell().textContent = formatarFabricante(v.vacina?.fabricante) || 'N/A';

            // Ações
            const cellAcoes = row.insertCell();
            cellAcoes.className = 'action-buttons-cell';
            
            const actionDiv = document.createElement('div');
            actionDiv.style.cssText = 'display: flex; gap: 8px; justify-content: center; align-items: center;';
            
            // Botão Editar
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-action btn-edit';
            btnEditar.innerHTML = '<i class="fa-solid fa-edit"></i>';
            btnEditar.title = 'Editar vacinação';
            btnEditar.onclick = () => abrirModalEdicao(v);
            
            // Botão Excluir
            const btnExcluir = document.createElement('button');
            btnExcluir.className = 'btn-action btn-delete';
            btnExcluir.innerHTML = '<i class="fa-solid fa-trash"></i>';
            btnExcluir.title = 'Excluir vacinação';
            btnExcluir.onclick = () => excluirVacinacao(v.uuid, v.vacina?.nome);
            
            actionDiv.appendChild(btnEditar);
            actionDiv.appendChild(btnExcluir);
            cellAcoes.appendChild(actionDiv);
        });

        criarPaginacao(vacinacoesOrdenadas.length);
        console.log(`✅ ${vacinacoesPaginadas.length} vacinações renderizadas (Página ${paginaAtual} de ${totalPaginas})`);
    }

    // ===== FUNÇÃO AUXILIAR PARA FORMATAR FABRICANTE =====
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

    // ===== FUNÇÃO AUXILIAR PARA CONVERTER DATA =====
    function converterParaDate(dataString) {
        if (!dataString) return new Date(0);
        
        if (dataString.includes('/')) {
            const [dia, mes, ano] = dataString.split('/');
            return new Date(ano, mes - 1, dia);
        }
        
        if (dataString.includes('-')) {
            const [ano, mes, dia] = dataString.split('-');
            return new Date(ano, mes - 1, dia.split('T')[0]);
        }
        
        return new Date(dataString);
    }

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

        const btnAnterior = criarBotaoPaginacao(
            '<i class="fa-solid fa-chevron-left"></i> Anterior',
            paginaAtual === 1,
            () => {
                if (paginaAtual > 1) {
                    paginaAtual--;
                    renderizarHistoricoVacinal(vacinacoesFiltradasAtual);
                }
            }
        );

        const paginasNumeros = document.createElement('div');
        paginasNumeros.style.cssText = 'display: flex; gap: 0.3rem;';

        for (let i = 1; i <= totalPaginas; i++) {
            const btnPagina = criarBotaoNumeroPagina(i, i === paginaAtual);
            paginasNumeros.appendChild(btnPagina);
        }

        const btnProximo = criarBotaoPaginacao(
            'Próximo <i class="fa-solid fa-chevron-right"></i>',
            paginaAtual === totalPaginas,
            () => {
                if (paginaAtual < totalPaginas) {
                    paginaAtual++;
                    renderizarHistoricoVacinal(vacinacoesFiltradasAtual);
                }
            }
        );

        botoesContainer.appendChild(btnAnterior);
        botoesContainer.appendChild(paginasNumeros);
        botoesContainer.appendChild(btnProximo);

        paginacaoContainer.appendChild(info);
        paginacaoContainer.appendChild(botoesContainer);

        historicoCard.appendChild(paginacaoContainer);
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
                renderizarHistoricoVacinal(vacinacoesFiltradasAtual);
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

    // ===== FILTRO DE VACINAÇÕES =====
    const filtroInput = document.getElementById('filtro-vacina');
    const btnLimparFiltro = document.getElementById('limpar-filtro');
    const resultadoFiltro = document.getElementById('resultado-filtro');

    if (filtroInput) {
        let debounceTimer;
        filtroInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const filtroTexto = normalizeText(filtroInput.value.trim());
                
                if (filtroTexto.length > 0) {
                    btnLimparFiltro.style.display = 'flex';
                    
                    vacinacoesFiltradasAtual = todasVacinacoes.filter(v => {
                        const nomeVacina = normalizeText(v.vacina?.nome || '');
                        return nomeVacina.includes(filtroTexto);
                    });
                    
                    if (vacinacoesFiltradasAtual.length > 0) {
                        resultadoFiltro.textContent = `${vacinacoesFiltradasAtual.length} vacinação(ões) encontrada(s)`;
                        resultadoFiltro.className = 'resultado-filtro tem-resultados';
                    } else {
                        resultadoFiltro.textContent = 'Nenhuma vacinação encontrada com este filtro';
                        resultadoFiltro.className = 'resultado-filtro sem-resultados';
                    }
                } else {
                    btnLimparFiltro.style.display = 'none';
                    vacinacoesFiltradasAtual = [...todasVacinacoes];
                    resultadoFiltro.textContent = '';
                    resultadoFiltro.className = 'resultado-filtro';
                }
                
                paginaAtual = 1;
                renderizarHistoricoVacinal(vacinacoesFiltradasAtual);
            }, 300);
        });
    }

    if (btnLimparFiltro) {
        btnLimparFiltro.addEventListener('click', () => {
            filtroInput.value = '';
            btnLimparFiltro.style.display = 'none';
            vacinacoesFiltradasAtual = [...todasVacinacoes];
            resultadoFiltro.textContent = '';
            resultadoFiltro.className = 'resultado-filtro';
            paginaAtual = 1;
            renderizarHistoricoVacinal(vacinacoesFiltradasAtual);
            filtroInput.focus();
        });
    }

    // ===== BOTÃO DE REGISTRAR NOVA VACINAÇÃO =====
    const btnRegistrarVacinacao = document.getElementById('btn-registrar-vacinacao');
    if (btnRegistrarVacinacao) {
        btnRegistrarVacinacao.addEventListener('click', () => {
            localStorage.setItem('pacienteSelecionado', JSON.stringify(pessoaAtual));
            window.location.href = `registrar-vacinacao.html?cpf=${pessoaAtual.cpf}`;
        });
    }

    // ===== INICIALIZAR =====
    buscarEExibirPaciente();
})();