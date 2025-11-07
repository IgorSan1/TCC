(function() {
    const API_BASE = "http://localhost:8080/api/v1";
    const token = localStorage.getItem("token");
    const urlParams = new URLSearchParams(window.location.search);
    const cpf = urlParams.get('cpf');

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

    // Função para formatar CPF
    function formatCpf(cpf) {
        if (!cpf || cpf.length !== 11) return cpf;
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    // Função para formatar data
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        // Se já estiver no formato DD/MM/YYYY
        if (dateString.includes('/')) {
            return dateString;
        }
        
        // Se estiver no formato ISO (YYYY-MM-DD)
        if (dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts;
                // Remove possível hora se existir
                const dayOnly = day.split('T')[0];
                return `${dayOnly}/${month}/${year}`;
            }
        }
        
        return dateString;
    }

    // Função para buscar e exibir os dados do paciente
    async function buscarEExibirPaciente() {
        try {
            console.log("🔍 Buscando paciente com CPF:", cpf);
            
            // 1. Buscar dados do paciente
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
            console.log("📦 Resposta da API (pessoa):", rawPessoa);
            
            // Extrair pessoa da resposta
            let pessoa = null;
            if (rawPessoa?.dados) {
                // Se dados é um array
                if (Array.isArray(rawPessoa.dados)) {
                    pessoa = rawPessoa.dados[0];
                } else {
                    pessoa = rawPessoa.dados;
                }
            } else {
                pessoa = rawPessoa;
            }

            console.log("✅ Pessoa extraída:", pessoa);

            if (!pessoa || !pessoa.uuid) {
                alert("Dados do paciente incompletos.");
                window.location.href = "home.html";
                return;
            }

            // 2. Exibir dados pessoais
            document.getElementById('nome-completo').textContent = pessoa.nomeCompleto || 'N/A';
            document.getElementById('cpf').textContent = formatCpf(pessoa.cpf) || 'N/A';
            document.getElementById('data-nascimento').textContent = formatDate(pessoa.dataNascimento) || 'N/A';
            document.getElementById('sexo').textContent = pessoa.sexo || 'N/A';
            document.getElementById('cns').textContent = pessoa.cns || 'N/A';
            document.getElementById('etnia').textContent = pessoa.etnia || 'N/A';
            document.getElementById('comunidade').textContent = pessoa.comunidade || 'N/A';
            document.getElementById('comorbidade').textContent = pessoa.comorbidade || 'Nenhuma';

            console.log("📋 Dados pessoais preenchidos com sucesso");

            // 3. Tentar buscar histórico vacinal (se o endpoint existir)
            try {
                console.log("💉 Tentando buscar histórico vacinal...");
                
                // O endpoint correto para histórico é `/vacinacao/historico-paciente/{uuid}`.
                // No entanto, o código atual busca todas as vacinações e tenta filtrar.
                // Vamos manter a busca por todas as vacinações, mas com um endpoint mais genérico se o específico falhar.
                // Se o endpoint `/vacinacao/historico-paciente/{uuid}` não funcionar, a busca por `/vacinacoes` é uma alternativa.
                const respVacinacoes = await fetch(`${API_BASE}/vacinacao/historico-paciente/${pessoa.uuid}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (respVacinacoes.ok) {
                    const rawVacinacoes = await respVacinacoes.json();
                    console.log("📦 Resposta da API (vacinações):", rawVacinacoes);
                    
                    let vacinacoes = [];
                    if (rawVacinacoes?.dados) {
                        vacinacoes = Array.isArray(rawVacinacoes.dados) ? rawVacinacoes.dados : [rawVacinacoes.dados];
                    }

                    // Filtrar vacinações do paciente
                    const historicoFiltrado = vacinacoes.filter(v => v.pessoa.uuid === pessoa.uuid);

                    if (historicoFiltrado.length > 0) {
                        const tbody = document.getElementById('historico-vacinacao-body');
                        tbody.innerHTML = ''; // Limpa qualquer conteúdo anterior

                        historicoFiltrado.forEach(vacinacao => {
                            const row = tbody.insertRow();
                            // Variáveis confirmadas: vacina.nome, dose, dataAplicacao, lote, fabricante. Removido profissional.nome.
                            row.insertCell().textContent = vacinacao.vacina.nome || 'N/A';
                            row.insertCell().textContent = formatDate(vacinacao.dataAplicacao) || 'N/A';
                            
                            // Adicionando Data da Próxima Dose
                            const proximaDose = vacinacao.dataProximaDose ? formatDate(vacinacao.dataProximaDose) : 'Não há próxima dose agendada';
                            row.insertCell().textContent = proximaDose;
                            
                            row.insertCell().textContent = vacinacao.lote || 'N/A';
                            row.insertCell().textContent = vacinacao.fabricante || 'N/A';
                        });
                        console.log("✅ Histórico vacinal preenchido com sucesso");
                    } else {
                        exibirHistoricoVazio();
                    }
                } else {
                    exibirHistoricoVazio();
                }
            } catch (err) {
                console.warn("⚠️ Não foi possível buscar histórico vacinal:", err);
                exibirHistoricoVazio();
            }

            // 4. Configurar botão de registrar nova vacinação
            const btnRegistrar = document.getElementById('btn-registrar-vacinacao');
            if (btnRegistrar) {
                btnRegistrar.addEventListener('click', () => {
                    // Salvar dados do paciente no localStorage
                    localStorage.setItem("pacienteSelecionado", JSON.stringify(pessoa));
                    // Redireciona para a página de registro
                    window.location.href = `registrar-vacinacao.html?cpf=${pessoa.cpf}`;
                });
            }

        } catch (err) {
            console.error("❌ Erro ao buscar dados do paciente:", err);
            alert("Falha ao buscar dados do paciente. Tente novamente.");
            window.location.href = "home.html";
        }
    }

    function exibirHistoricoVazio() {
        const tbody = document.getElementById('historico-vacinacao-body');
        const msgVazio = document.getElementById('historico-vacinacao-vazio');
        
        if (tbody) {
            tbody.innerHTML = '';
        }
        
        if (msgVazio) {
            msgVazio.style.display = 'block';
        }
        
        console.log("📝 Exibindo mensagem de histórico vazio");
    }

    // Configurar botão voltar
    const btnVoltar = document.querySelector('a[href="home.html"]');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem("pacienteSelecionado");
            window.location.href = "home.html";
        });
    }

    // Inicia a busca
    console.log("🚀 Iniciando busca do paciente...");
    buscarEExibirPaciente();
})();