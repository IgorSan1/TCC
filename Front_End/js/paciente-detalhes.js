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
        // O backend retorna a data no formato ISO (YYYY-MM-DD).
        // O construtor Date pode ter problemas de fuso horário.
        // É mais seguro fazer o parse manual para garantir DD/MM/AAAA.
        const parts = dateString.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            return `${day}/${month}/${year}`;
        }
        return dateString; // Retorna a string original se o formato for inesperado
    }

    // Função para buscar e exibir os dados do paciente
    async function buscarEExibirPaciente() {
        try {
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

            let rawPessoa;
            try {
                rawPessoa = await respPessoa.json();
            } catch (e) {
                console.error("Erro ao fazer parse do JSON da resposta de pessoa:", e);
                alert("Erro ao processar dados do paciente. Resposta inválida do servidor.");
                window.location.href = "home.html";
                return;
            }
            
            let pessoa = rawPessoa?.dados || rawPessoa;

            // Normaliza o objeto pessoa
            // O backend parece retornar a pessoa diretamente ou dentro de um array 'dados'
            if (Array.isArray(pessoa)) {
                pessoa = pessoa[0];
            }
            
            // Se a resposta for um objeto com a chave 'dados' que é um array, pega o primeiro elemento
            if (rawPessoa?.dados && Array.isArray(rawPessoa.dados)) {
                pessoa = rawPessoa.dados[0] || rawPessoa.dados;
            } else if (rawPessoa?.dados) {
                pessoa = rawPessoa.dados;
            } else {
                pessoa = rawPessoa;
            }
            
            // Última tentativa de normalização: se ainda for um array, pega o primeiro elemento
            if (Array.isArray(pessoa)) {
                pessoa = pessoa[0];
            }

            if (!pessoa || !pessoa.uuid) {
                alert("Dados do paciente incompletos.");
                window.location.href = "home.html";
                return;
            }

            // 2. Exibir dados pessoais
            // Campos de destaque removidos do cabeçalho
            docdocument.getElementById('nome-completo').textContent = pessoa.nomeCompleto || 'N/A';
            document.getElementById('cpf').textContent = formatCpf(pessoa.cpf) || 'N/A';
            document.getElementById('data-nascimento').textContent = formatDate(pessoa.dataNascimento) || 'N/A';
            document.getElementById('sexo').textContent = pessoa.sexo || 'N/A';
            document.getElementById('cns').textContent = pessoa.cns || 'N/A';
            document.getElementById('etnia').textContent = pessoa.etnia || 'N/A';
            document.getElementById('comunidade').textContent = pessoa.comunidade || 'N/A';
            document.getElementById('comorbidade').textContent = pessoa.comorbidade || 'N/A';

            // 3. Buscar histórico vacinal
            const respHistorico = await fetch(`${API_BASE}/vacinacao/historico-paciente/${pessoa.uuid}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!respHistorico.ok) {
                // Se não encontrar histórico, apenas exibe a mensagem de vazio
                exibirHistoricoVazio();
                return;
            }

            const rawHistorico = await respHistorico.json();
            let historico = rawHistorico?.dados || rawHistorico;

            if (Array.isArray(historico?.dados)) {
                historico = historico.dados;
            }

            // 4. Exibir histórico vacinal
            const tbody = document.getElementById('historico-vacinacao-body');
            tbody.innerHTML = ''; // Limpa qualquer conteúdo anterior

            if (historico && historico.length > 0) {
                historico.forEach(vacinacao => {
                    const row = tbody.insertRow();
                    row.insertCell().textContent = vacinacao.vacinaNome || 'N/A';
                    row.insertCell().textContent = vacinacao.dose || 'N/A';
                    row.insertCell().textContent = formatDate(vacinacao.dataAplicacao) || 'N/A';
                    row.insertCell().textContent = vacinacao.lote || 'N/A';
                    row.insertCell().textContent = vacinacao.fabricante || 'N/A';
                    row.insertCell().textContent = vacinacao.profissionalNome || 'N/A';
                });
            } else {
                exibirHistoricoVazio();
            }

            // 5. Configurar botão de registrar nova vacinação
            document.getElementById('btn-registrar-vacinacao').addEventListener('click', () => {
                // Redireciona para a página de registro, preenchendo o CPF automaticamente
                window.location.href = `registrar-vacinacao.html?cpf=${pessoa.cpf}`;
            });

        } catch (err) {
            console.error("Erro ao buscar dados do paciente:", err);
            alert("Falha ao buscar dados do paciente. Tente novamente. Detalhes no console.");
            console.error("Erro capturado:", err);
            window.location.href = "home.html";
        }
    }

    function exibirHistoricoVazio() {
        document.getElementById('historico-vacinacao-vazio').style.display = 'block';
    }

    // Inicia a busca
    buscarEExibirPaciente();
})();
