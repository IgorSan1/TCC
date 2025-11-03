(function(){
    const API_BASE = "http://localhost:8080/api/v1";
    const listaVacinas = document.getElementById("lista-vacinas");
    const vacinaNomeInput = document.getElementById("vacina-nome");
    const vacinaUuidInput = document.getElementById("vacina-uuid");
    const pessoaCpfInput = document.getElementById("pessoa-cpf");
    const pessoaUuidInput = document.getElementById("pessoa-uuid");
    let vacinasCache = [];
    let debounceId;

    function formatDateToDDMMYYYY(isoDate) {
        if (!isoDate) return "";
        const [y, m, d] = isoDate.split("-");
        return `${d}/${m}/${y}`;
    }

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

    // Aplicar máscara de CPF - CORREÇÃO DO ERRO AQUI
    pessoaCpfInput.addEventListener("input", () => {
        pessoaCpfInput.value = applyCpfMask(pessoaCpfInput.value);
    });

    async function carregarVacinas() {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Você precisa estar logado para carregar vacinas.");
            window.location.href = "login.html";
            return;
        }

        try {
            const resp = await fetch(`${API_BASE}/vacina/all?size=200&page=0`, {
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });

            if (!resp.ok) {
                console.error("Erro ao carregar vacinas:", resp.status);
                vacinasCache = [];
                return;
            }

            const data = await resp.json().catch(() => ({}));
            console.log("📦 Dados recebidos da API:", data);

            // Ajuste para o formato { dados: [[{...}]] }
            if (Array.isArray(data?.dados) && Array.isArray(data.dados[0])) {
                vacinasCache = data.dados[0];
            } else if (Array.isArray(data?.dados)) {
                vacinasCache = data.dados;
            } else {
                vacinasCache = [];
            }
            
            console.log("✅ Vacinas carregadas:", vacinasCache.length);
        } catch (err) {
            console.error("❌ Erro ao carregar vacinas:", err);
            vacinasCache = [];
        }
    }

    function montarLabelVacina(v) {
        const nome = v?.nome || "";
        return nome;
    }

    function atualizarDatalist(filtro) {
        const f = (filtro || "").toLowerCase();
        listaVacinas.innerHTML = "";
        const filtradas = vacinasCache.filter((v) =>
            (v?.nome || "").toLowerCase().includes(f)
        );
        console.log("Vacinas filtradas:", filtradas);
        filtradas.slice(0, 20).forEach((v) => {
            const opt = document.createElement("option");
            opt.value = montarLabelVacina(v);
            opt.setAttribute("data-uuid", v.uuid || "");
            listaVacinas.appendChild(opt);
        });
    }

    // Inicializa carregando as vacinas
    carregarVacinas();

    // Enquanto digita: filtra e sugere (debounce)
    vacinaNomeInput.addEventListener("input", () => {
        clearTimeout(debounceId);
        const val = vacinaNomeInput.value;
        debounceId = setTimeout(() => {
            atualizarDatalist(val);
            vacinaUuidInput.value = "";
            const opts = Array.from(listaVacinas.options);
            if (
                opts.length === 1 &&
                opts[0].value.toLowerCase().includes((val || "").toLowerCase())
            ) {
                vacinaUuidInput.value = opts[0].getAttribute("data-uuid") || "";
            }
        }, 120);
    });

    // Ao sair do campo: tenta exata -> parcial -> nenhuma
    vacinaNomeInput.addEventListener("change", () => {
        const val = (vacinaNomeInput.value || "").trim().toLowerCase();
        const opts = Array.from(listaVacinas.options);
        let found = opts.find((o) => o.value.toLowerCase() === val);
        if (!found) found = opts.find((o) => o.value.toLowerCase().includes(val));
        if (!found && opts.length === 1) found = opts[0];
        if (found) {
            vacinaUuidInput.value = found.getAttribute("data-uuid") || "";
            console.log("Vacina selecionada:", found.value, "UUID:", vacinaUuidInput.value);
        } else {
            vacinaUuidInput.value = "";
            console.warn("Vacina não encontrada na lista:", vacinaNomeInput.value);
        }
    });

    // Também marca uuid se o usuário escolheu uma opção exata
    vacinaNomeInput.addEventListener("input", () => {
        const opts = Array.from(listaVacinas.options);
        const found = opts.find((o) => o.value === vacinaNomeInput.value);
        if (found) vacinaUuidInput.value = found.getAttribute("data-uuid") || "";
    });

    // Verificar se há CPF na URL (vindo da busca na home)
    const urlParams = new URLSearchParams(window.location.search);
    const cpfFromUrl = urlParams.get('cpf');
    if (cpfFromUrl) {
        pessoaCpfInput.value = applyCpfMask(cpfFromUrl);
        
        // Buscar automaticamente o paciente
        const pacienteData = localStorage.getItem("pacienteSelecionado");
        if (pacienteData) {
            try {
                const paciente = JSON.parse(pacienteData);
                pessoaUuidInput.value = paciente.uuid;
                console.log("Paciente pré-carregado:", paciente);
            } catch (e) {
                console.error("Erro ao carregar paciente:", e);
            }
        }
    }

    document.getElementById("form-registrar-vacinacao").addEventListener("submit", async function (e) {
        e.preventDefault();
        
        const aplicacaoRaw = document.getElementById("aplicacao").value;
        if (!aplicacaoRaw) {
            alert("Informe a data de aplicação.");
            return;
        }
        const dataAplicacao = formatDateToDDMMYYYY(aplicacaoRaw);
        
        const proximaRaw = document.getElementById("proxima").value;
        const dataProximaDose = proximaRaw ? formatDateToDDMMYYYY(proximaRaw) : null;

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Você precisa estar logado para registrar vacinação.");
            window.location.href = "login.html";
            return;
        }

        // Resolver pessoa por CPF se não tiver UUID ainda
        if (!pessoaUuidInput.value) {
            const cpfDigits = (pessoaCpfInput.value || "").replace(/\D/g, "");
            if (cpfDigits.length !== 11) {
                alert("Informe um CPF válido (11 dígitos).");
                return;
            }

            try {
                const respPessoa = await fetch(`${API_BASE}/pessoa/buscar-por-cpf`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({ cpf: cpfDigits }),
                });
                
                if (!respPessoa.ok) {
                    const dataPessoaErr = await respPessoa.json().catch(() => ({}));
                    alert(dataPessoaErr?.mensagem || "Paciente não encontrado");
                    return;
                }
                
                const raw = await respPessoa.json().catch(() => ({}));
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

                pessoaUuidInput.value = pessoa?.uuid || "";
                if (!pessoaUuidInput.value) {
                    alert("Paciente não encontrado (UUID ausente).");
                    return;
                }
            } catch (err) {
                console.error("Falha ao buscar paciente por CPF:", err);
                alert("Falha ao buscar paciente por CPF.");
                return;
            }
        }

        if (!vacinaUuidInput.value) {
            alert("Selecione uma vacina válida.");
            return;
        }

        const payload = {
            pessoaUuid: pessoaUuidInput.value.trim(),
            vacinaUuid: vacinaUuidInput.value.trim(),
            dataAplicacao,
            dataProximaDose: dataProximaDose || null,
        };

        if (!payload.pessoaUuid || !payload.vacinaUuid || !payload.dataAplicacao) {
            alert("Preencha Pessoa UUID, Vacina UUID e a data de aplicação.");
            return;
        }

        console.log("📤 Enviando payload:", payload);

        try {
            const resp = await fetch(`${API_BASE}/vacinacoes/registrar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            
            const data = await resp.json().catch(() => ({}));
            
            if (!resp.ok) {
                console.error("Erro na resposta:", data);
                alert(`Erro ao registrar vacinação: ${data?.mensagem || resp.status}`);
                return;
            }
            
            alert("Vacinação registrada com sucesso!");
            localStorage.removeItem("pacienteSelecionado"); // Limpar dados temporários
            window.location.href = "home.html";
        } catch (err) {
            console.error("Erro ao registrar vacinação:", err);
            alert("Falha de comunicação com o servidor.");
        }
    });
})();