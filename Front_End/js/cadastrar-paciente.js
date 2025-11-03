document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".card form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const cns = document.getElementById("cns").value.trim();
        const cpf = document.getElementById("cpf").value.replace(/\D/g, ""); // Remove caracteres não numéricos
        const nascimento = document.getElementById("nascimento").value; // yyyy-MM-dd
        const nomeCompleto = document.getElementById("nome").value.trim();
        const etnia = document.getElementById("etnia").value.trim();
        const sexo = document.getElementById("sexo").value;
        const comunidade = document.getElementById("comunidade").value.trim();
        const comorbidade = document.getElementById("comorbidade").value.trim();

        // Validações básicas
        if (!cns || !cpf || !nascimento || !nomeCompleto || !etnia || !sexo || !comunidade || !comorbidade) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        // Validar tamanho do CPF (11 dígitos)
        if (cpf.length !== 11) {
            alert("CPF deve ter exatamente 11 dígitos.");
            return;
        }

        // Validar tamanho do CNS (15 dígitos)
        const cnsLimpo = cns.replace(/\D/g, "");
        if (cnsLimpo.length !== 15) {
            alert("CNS deve ter exatamente 15 dígitos.");
            return;
        }

        // Converter data de yyyy-MM-dd para dd/MM/yyyy
        const partes = nascimento.split("-");
        const dataNascimento = `${partes[2]}/${partes[1]}/${partes[0]}`;

        const data = {
            nomeCompleto,
            cpf,
            sexo,
            dataNascimento,
            comorbidade,
            etnia,
            cns: cnsLimpo,
            comunidade
        };

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Você precisa estar logado para cadastrar um paciente.");
                window.location.href = "login.html";
                return;
            }

            const response = await fetch("http://localhost:8080/api/v1/pessoa", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.mensagem || "Paciente cadastrado com sucesso!");
                form.reset();
                window.location.href = "home.html";
            } else {
                const errorData = await response.json().catch(() => ({ mensagem: response.statusText }));
                alert(`Erro ao cadastrar paciente: ${errorData.mensagem}`);
            }
        } catch (error) {
            console.error("Erro:", error);
            alert("Erro ao conectar com o servidor.");
        }
    });

    // Adicionar botão de cancelar
    const btnCancelar = document.querySelector(".btn-secondary");
    if (btnCancelar) {
        btnCancelar.addEventListener("click", () => {
            window.location.href = "home.html";
        });
    }
});

