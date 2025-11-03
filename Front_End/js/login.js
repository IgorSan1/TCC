document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector(".auth-box form");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const usuario = document.getElementById("usuario").value.trim();
        const password = document.getElementById("senha").value.trim();

        // Validações básicas
        if (!usuario || !password) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario, password }),
            });

            if (response.ok) {
                const result = await response.json();
                
                // O backend retorna um objeto com estrutura: { tipo, mensagem, dados: { token } }
                const token = result.dados?.[0]?.token || result.token;
                
                if (token) {
                    localStorage.setItem("token", token);
                    alert(result.mensagem || "Login bem-sucedido!");
                    window.location.href = "home.html";
                } else {
                    alert("Erro: Token não recebido do servidor.");
                }
            } else {
                const result = await response.json();
                alert(result.mensagem || result.message || "Usuário ou senha inválidos.");
            }
        } catch (error) {
            console.error("Erro:", error);
            alert("Erro ao conectar com o servidor.");
        }
    });
});
