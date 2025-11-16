(function(){
    const API_BASE = "http://localhost:8080/api/v1";
    let usuarioAtual = null;
    let isAdmin = false;

    // Função para decodificar o token JWT e extrair informações
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

    // Função para formatar CPF
    function formatarCpf(cpf) {
        if (!cpf) return "";
        const digits = cpf.replace(/\D/g, "");
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    // Função para formatar telefone
    function formatarTelefone(telefone) {
        if (!telefone) return "";
        const digits = telefone.replace(/\D/g, "");
        if (digits.length === 11) {
            return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        } else if (digits.length === 10) {
            return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
        }
        return telefone;
    }

    // Função para formatar data de yyyy-MM-dd para dd/MM/yyyy
    function formatarData(data) {
        if (!data) return "";
        
        if (data.includes('/')) {
            return data;
        }
        
        if (data.includes('-')) {
            const [ano, mes, dia] = data.split("-");
            return `${dia}/${mes}/${ano}`;
        }
        
        try {
            const date = new Date(data);
            const dia = String(date.getDate()).padStart(2, '0');
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const ano = date.getFullYear();
            return `${dia}/${mes}/${ano}`;
        } catch (e) {
            return data;
        }
    }

    // Função para formatar data para input (yyyy-MM-dd)
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

    // Função para formatar data para dd/MM/yyyy
    function formatDateToDDMMYYYY(isoDate) {
        if (!isoDate) return null;
        const [y, m, d] = isoDate.split("-");
        return `${d}/${m}/${y}`;
    }

    // Função para formatar o cargo
    function formatarCargo(cargo) {
        if (!cargo) return "";
        
        const cargos = {
            'TECNICO': 'Técnico',
            'ENFERMEIRO': 'Enfermeiro',
            'TECNICO_DE_ENFERMAGEM': 'Técnico de Enfermagem'
        };
        
        return cargos[cargo] || cargo;
    }

    // ===== CARREGAR PERFIL DO USUÁRIO =====
    async function carregarPerfilUsuario() {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Você precisa estar logado para acessar o perfil.");
            window.location.href = "login.html";
            return;
        }

        const decodedToken = decodeJWT(token);
        const username = decodedToken?.sub;
        const role = decodedToken?.role;
        
        if (!username) {
            alert("Token inválido. Faça login novamente.");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        // Verificar se é admin
        isAdmin = (role === 'ADMIN');
        console.log("👤 Usuário logado:", username, "| Role:", role, "| Is Admin:", isAdmin);

        try {
            // ✅ CORREÇÃO: Se for ADMIN, buscar na lista de usuários mesmo assim
            // pois o backend retorna apenas da tabela 'usuario'
            const resp = await fetch(`${API_BASE}/usuario?size=1000&page=0`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!resp.ok) {
                console.error("Erro ao carregar perfil:", resp.status);
                // ✅ Se não encontrou na tabela usuario, preencher dados básicos do token
                preencherPerfilDoToken(decodedToken);
                return;
            }

            const data = await resp.json().catch(() => ({}));
            console.log("📦 Dados recebidos:", data);

            let usuarios = [];
            if (Array.isArray(data?.dados) && Array.isArray(data.dados[0])) {
                usuarios = data.dados[0];
            } else if (Array.isArray(data?.dados)) {
                usuarios = data.dados;
            }

            const usuario = usuarios.find(u => u.usuario === username);

            if (usuario) {
                console.log("✅ Usuário encontrado na tabela usuario:", usuario);
                usuarioAtual = usuario;
                preencherPerfil(usuario);
            } else {
                // ✅ Se for ADMIN e não encontrou na tabela usuario, 
                // mostrar dados do token (admin puro, sem registro em usuario)
                console.warn("⚠️ Usuário ADMIN não encontrado na tabela usuario");
                console.log("📝 Preenchendo dados básicos do token");
                preencherPerfilDoToken(decodedToken);
            }
        } catch (err) {
            console.error("❌ Erro ao carregar perfil:", err);
            preencherPerfilDoToken(decodedToken);
        }
    }

    function preencherPerfilDoToken(decodedToken) {
        console.log("📝 Preenchendo perfil a partir do token (ADMIN puro)");
        
        const headerUserSpan = document.querySelector(".user-profile span");
        if (headerUserSpan) {
            headerUserSpan.textContent = decodedToken.sub || "Administrador";
        }

        // Preencher apenas o campo de usuário
        document.getElementById('view-usuario').value = decodedToken.sub || "";
        
        // ✅ Para ADMIN puro (sem registro completo), mostrar mensagem informativa
        if (isAdmin) {
            // Ocultar campos vazios e mostrar mensagem
            const perfilCard = document.querySelector('.profile-card');
            
            // Adicionar aviso no início do card
            const avisoDiv = document.createElement('div');
            avisoDiv.className = 'info-box';
            avisoDiv.style.cssText = `
                background: #fff9e6;
                border-left: 4px solid #ffc107;
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1.5rem;
            `;
            avisoDiv.innerHTML = `
                <strong style="color: #856404; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-circle-info"></i> Perfil Administrativo
                </strong>
                <p style="margin-top: 0.5rem; color: #212529; font-size: 0.9rem;">
                    Você está logado como <strong>Administrador do Sistema</strong>. 
                    Este perfil não possui informações detalhadas cadastradas.
                    <br><br>
                    Para ter um perfil completo com todas as informações, cadastre-se como usuário através da página 
                    <a href="cadastrar-usuario.html" style="color: #007BFF; font-weight: 600;">Cadastrar Usuário</a> 
                    e selecione o perfil ADMIN.
                </p>
            `;
            
            // Inserir após o header
            const profileHeader = perfilCard.querySelector('.profile-header');
            profileHeader.after(avisoDiv);
            
            // Ocultar botão de editar para admin puro
            const btnEditar = document.getElementById('btn-editar-perfil');
            if (btnEditar) {
                btnEditar.style.display = 'none';
            }
            
            // Limpar campos que não temos dados
            document.getElementById('view-cpf').value = "N/A";
            document.getElementById('view-data-nascimento').value = "N/A";
            document.getElementById('view-nome-completo').value = decodedToken.sub || "Administrador";
            document.getElementById('view-email').value = "N/A";
            document.getElementById('view-telefone').value = "N/A";
            document.getElementById('view-cargo').value = "Administrador do Sistema";
        }
    }

    function preencherPerfil(usuario) {
        console.log("📝 Preenchendo perfil completo");
        
        const headerUserSpan = document.querySelector(".user-profile span");
        if (headerUserSpan) {
            headerUserSpan.textContent = usuario.usuario || "Usuário";
        }

        document.getElementById('view-usuario').value = usuario.usuario || "";
        document.getElementById('view-cpf').value = formatarCpf(usuario.cpf) || "";
        document.getElementById('view-data-nascimento').value = formatarData(usuario.dataNascimento) || "";
        document.getElementById('view-nome-completo').value = usuario.nomeCompleto || "";
        document.getElementById('view-email').value = usuario.email || "";
        document.getElementById('view-telefone').value = formatarTelefone(usuario.telefone) || "";
        document.getElementById('view-cargo').value = formatarCargo(usuario.cargo) || "";
    }

    // ===== MODAL DE EDIÇÃO =====
    window.abrirModalEdicaoPerfil = function() {
        if (!usuarioAtual) {
            alert("Erro: Perfil não disponível para edição. Apenas usuários com cadastro completo podem editar o perfil.");
            return;
        }

        console.log("📝 Abrindo modal de edição do perfil");

        document.getElementById('edit-usuario-uuid').value = usuarioAtual.uuid;
        document.getElementById('edit-usuario').value = usuarioAtual.usuario || '';
        document.getElementById('edit-cpf').value = formatarCpf(usuarioAtual.cpf) || '';
        
        const dataNasc = formatarDataParaInput(usuarioAtual.dataNascimento);
        document.getElementById('edit-data-nascimento').value = dataNasc;
        
        document.getElementById('edit-nome-completo').value = usuarioAtual.nomeCompleto || '';
        document.getElementById('edit-email').value = usuarioAtual.email || '';
        document.getElementById('edit-telefone').value = usuarioAtual.telefone || '';
        document.getElementById('edit-cargo').value = usuarioAtual.cargo || '';

        // Limpar campos de senha
        document.getElementById('edit-senha').value = '';
        document.getElementById('edit-confirmar-senha').value = '';

        // ✅ REGRA: Apenas ADMIN pode editar cargo
        const campoCargo = document.getElementById('edit-cargo');
        const avisoCargo = document.getElementById('aviso-cargo-bloqueado');
        
        if (isAdmin) {
            campoCargo.disabled = false;
            campoCargo.style.backgroundColor = '';
            campoCargo.style.color = '';
            campoCargo.style.cursor = '';
            avisoCargo.style.display = 'none';
            console.log("✅ ADMIN - Campo cargo DESBLOQUEADO");
        } else {
            campoCargo.disabled = true;
            campoCargo.style.backgroundColor = 'var(--input-background)';
            campoCargo.style.color = 'var(--text-secondary)';
            campoCargo.style.cursor = 'not-allowed';
            avisoCargo.style.display = 'block';
            console.log("🚫 USER - Campo cargo BLOQUEADO");
        }

        // ✅ REGRA: Apenas ADMIN pode alterar senha
        const secaoSeguranca = document.getElementById('secao-seguranca');
        const campoSenha = document.getElementById('edit-senha');
        const campoConfirmarSenha = document.getElementById('edit-confirmar-senha');
        const avisoSenha = document.getElementById('aviso-senha-bloqueada');
        
        if (isAdmin) {
            secaoSeguranca.style.display = 'block';
            campoSenha.disabled = false;
            campoConfirmarSenha.disabled = false;
            avisoSenha.style.display = 'none';
            console.log("✅ ADMIN - Alteração de senha PERMITIDA");
        } else {
            secaoSeguranca.style.display = 'none';
            campoSenha.disabled = true;
            campoConfirmarSenha.disabled = true;
            console.log("🚫 USER - Alteração de senha BLOQUEADA (seção oculta)");
        }

        document.getElementById('modal-editar-perfil').style.display = 'flex';
    };

    window.fecharModalEdicaoPerfil = function() {
        document.getElementById('modal-editar-perfil').style.display = 'none';
        document.getElementById('form-editar-perfil').reset();
    };

    // Fechar modal ao clicar fora
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('modal-editar-perfil');
        if (e.target === modal) {
            fecharModalEdicaoPerfil();
        }
    });

    // ===== SUBMISSÃO DO FORMULÁRIO =====
    document.getElementById('form-editar-perfil').addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!usuarioAtual) {
            alert("Erro: Não é possível editar este perfil.");
            return;
        }

        const usuarioUuid = document.getElementById('edit-usuario-uuid').value;
        const usuario = document.getElementById('edit-usuario').value.trim();
        const nomeCompleto = document.getElementById('edit-nome-completo').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        const telefone = document.getElementById('edit-telefone').value.replace(/\D/g, '');
        const dataNascimentoInput = document.getElementById('edit-data-nascimento').value;
        const cargo = document.getElementById('edit-cargo').value;
        const senha = document.getElementById('edit-senha').value;
        const confirmarSenha = document.getElementById('edit-confirmar-senha').value;

        // Validações
        if (!usuario || !nomeCompleto || !email || !dataNascimentoInput || !cargo) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Por favor, informe um e-mail válido.");
            return;
        }

        // Validar senha (se preenchida e se for ADMIN)
        let novaSenha = null;
        if (isAdmin && senha) {
            if (senha !== confirmarSenha) {
                alert("As senhas não coincidem.");
                return;
            }
            if (senha.length < 4) {
                alert("A senha deve ter pelo menos 4 caracteres.");
                return;
            }
            novaSenha = senha;
        }

        // Converter data
        const dataNascimento = formatDateToDDMMYYYY(dataNascimentoInput);

        // Usar CPF original do usuarioAtual
        const cpf = usuarioAtual.cpf;

        // Usar role original do usuarioAtual
        const role = usuarioAtual.role;

        const payload = {
            nomeCompleto,
            cpf,
            dataNascimento,
            email,
            telefone,
            usuario,
            role,
            cargo
        };

        // Apenas adicionar password se ADMIN alterou
        if (novaSenha) {
            payload.password = novaSenha;
        }

        console.log("📤 Atualizando perfil:", payload);

        try {
            const token = localStorage.getItem("token");
            
            // Verificar se o usuário está alterando o próprio nome de usuário
            const decodedToken = decodeJWT(token);
            const usernameAtual = decodedToken?.sub;
            const alterouUsuario = (usuario !== usernameAtual);
            
            const response = await fetch(`${API_BASE}/usuario/${usuarioUuid}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Perfil atualizado com sucesso!");
                fecharModalEdicaoPerfil();
                
                // ✅ Se alterou o nome de usuário, fazer logout e redirecionar
                if (alterouUsuario) {
                    alert("Seu nome de usuário foi alterado. Você será redirecionado para fazer login novamente com suas novas credenciais.");
                    localStorage.removeItem("token");
                    localStorage.removeItem("pacienteSelecionado");
                    window.location.href = "login.html";
                } else {
                    // Apenas recarregar perfil se não alterou usuário
                    await carregarPerfilUsuario();
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Erro ao atualizar perfil: ${errorData.mensagem || response.statusText}`);
            }
        } catch (error) {
            console.error("❌ Erro ao atualizar perfil:", error);
            alert("Erro ao conectar com o servidor.");
        }
    });

    // ===== MÁSCARAS =====
    const telefoneInput = document.getElementById('edit-telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > 11) value = value.slice(0, 11);
            
            if (value.length === 0) {
                e.target.value = "";
            } else if (value.length <= 2) {
                e.target.value = `(${value}`;
            } else if (value.length <= 7) {
                e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            } else {
                e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
            }
        });
    }

    // ===== BOTÃO DE EDITAR =====
    const btnEditar = document.getElementById('btn-editar-perfil');
    if (btnEditar) {
        btnEditar.addEventListener('click', abrirModalEdicaoPerfil);
    }

    // Carregar perfil ao inicializar
    carregarPerfilUsuario();
})();