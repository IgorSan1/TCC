document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:8080/api/v1";
  const form = document.getElementById("cadastroUsuarioForm");
  const btnCancelar = document.getElementById("btnCancelar");

  (function verificarAcessoAdmin() {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Você precisa estar logado para acessar esta página.");
      window.location.href = "login.html";
      return;
    }

    // Decodificar token JWT
    function decodeJWT(token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );
        return JSON.parse(jsonPayload);
      } catch (e) {
        console.error("Erro ao decodificar token:", e);
        return null;
      }
    }

    const decodedToken = decodeJWT(token);
    const role = decodedToken?.role;

    // Se NÃO for ADMIN, bloquear acesso
    if (role !== "ADMIN") {
      alert(
        "⚠️ ACESSO NEGADO\n\nApenas administradores podem cadastrar novos usuários.\n\nVocê será redirecionado para a página inicial."
      );
      window.location.href = "home.html";
      return;
    }
    
  })();

  // Função para aplicar máscara de CPF
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

  // Função para aplicar máscara de telefone
  function applyPhoneMask(value) {
    const digits = (value || "").replace(/\D/g, "").slice(0, 11);
    if (digits.length === 0) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  // Aplicar máscara de CPF ao digitar
  const cpfInput = document.getElementById("cpf");
  cpfInput.addEventListener("input", () => {
    cpfInput.value = applyCpfMask(cpfInput.value);
  });

  // Aplicar máscara de telefone ao digitar
  const telefoneInput = document.getElementById("telefone");
  telefoneInput.addEventListener("input", () => {
    telefoneInput.value = applyPhoneMask(telefoneInput.value);
  });

  // Submeter formulário
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nomeCompleto = document.getElementById("nomeCompleto").value.trim();
    const usuario = document.getElementById("usuario").value.trim();
    const email = document.getElementById("email").value.trim();
    const cpf = document.getElementById("cpf").value.replace(/\D/g, "");
    const telefone = document
      .getElementById("telefone")
      .value.replace(/\D/g, "");
    const dataNascimento = document.getElementById("dataNascimento").value;
    const cargo = document.getElementById("cargo").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;
    const role = document.getElementById("role").value;

    // Validações básicas
    if (
      !nomeCompleto ||
      !usuario ||
      !email ||
      !cpf ||
      !dataNascimento ||
      !senha ||
      !confirmarSenha ||
      !role
    ) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Validar CPF
    if (cpf.length !== 11) {
      alert("CPF deve ter exatamente 11 dígitos.");
      return;
    }

    // Validar senhas
    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem.");
      return;
    }

    if (senha.length < 4) {
      alert("A senha deve ter pelo menos 4 caracteres.");
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Por favor, informe um e-mail válido.");
      return;
    }

    // Converter data de yyyy-MM-dd para dd/MM/yyyy
    const partes = dataNascimento.split("-");
    const dataNascimentoFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;

    // Ajustar o payload para corresponder ao que o backend espera
    const data = {
      nomeCompleto,
      usuario,
      email,
      cpf,
      telefone,
      dataNascimento: dataNascimentoFormatada,
      cargo,
      password: senha,
      role: role, // Enviar como string direta
    };

    console.log("📤 Enviando payload:", data);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Você precisa estar logado para cadastrar um usuário.");
        window.location.href = "login.html";
        return;
      }

      const response = await fetch(`${API_BASE}/usuario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      console.log("📥 Status da resposta:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Resposta:", result);
        alert(result.mensagem || "Usuário cadastrado com sucesso!");
        form.reset();
        window.location.href = "home.html";
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ mensagem: response.statusText }));
        console.error("❌ Erro:", errorData);
        alert(
          `Erro ao cadastrar usuário: ${
            errorData.mensagem || errorData.message || "Erro desconhecido"
          }`
        );
      }
    } catch (error) {
      console.error("❌ Erro na requisição:", error);
      alert("Erro ao conectar com o servidor. Verifique sua conexão.");
    }
  });

  // Botão de cancelar
  if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
      if (
        confirm("Deseja realmente cancelar? As informações não serão salvas.")
      ) {
        window.location.href = "home.html";
      }
    });
  }
});
