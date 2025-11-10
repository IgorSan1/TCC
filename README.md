# YaraVac 💉

**Sistema inteligente de gerenciamento de vacinação para comunidades indígenas, transformando o cuidado em saúde com tecnologia acessível e eficiente.**

---

## 📋 Sobre o Projeto

### Descrição Breve
YaraVac é uma solução completa de gestão de vacinação desenvolvida especialmente para atender comunidades indígenas. O sistema permite o cadastro de pacientes, registro de vacinações, controle de estoque de vacinas e acompanhamento do histórico vacinal de forma simples e intuitiva.

### 🌟 O Que Torna Isso Especial
- **Foco em Comunidades Indígenas**: Sistema pensado para as necessidades específicas das populações indígenas, com campos para etnia, comunidade e características culturais
- **Segurança Robusta**: Autenticação JWT com controle de acesso baseado em roles (ADMIN e USER)
- **Rastreabilidade Completa**: Histórico detalhado com informações de lote, fabricante e datas de doses
- **Interface Intuitiva**: Design limpo e responsivo que facilita o uso por profissionais de saúde em campo

### 💡 Benefícios para o Usuário
- ✅ **Agilidade**: Cadastro e consulta rápida de pacientes por CPF
- ✅ **Organização**: Controle centralizado de todas as vacinações
- ✅ **Segurança**: Dados protegidos com criptografia e controle de acesso
- ✅ **Mobilidade**: Interface responsiva que funciona em dispositivos móveis
- ✅ **Rastreamento**: Acompanhamento de próximas doses e histórico completo

### 🎯 Destaques Técnicos
- **Arquitetura RESTful** com documentação Swagger/OpenAPI
- **Paginação Inteligente**: Sistema de listagem com filtros e busca avançada
- **Validações Robustas**: Verificação de CPF, CNS e dados obrigatórios
- **Soft Delete**: Remoção lógica de registros mantendo histórico
- **Auditoria Completa**: Timestamps automáticos de criação, atualização e remoção

---

## 🎬 Demonstração

### Funcionalidades Principais

#### 1️⃣ **Dashboard Intuitivo**
- Visão geral com estatísticas de vacinação
- Ações rápidas para cadastros
- Busca inteligente de pacientes
- Indicadores de cobertura vacinal

#### 2️⃣ **Gestão de Pacientes**
- Cadastro completo com validações
- Busca por CPF com máscara automática
- Histórico vacinal detalhado
- Filtro de vacinações por nome da vacina

#### 3️⃣ **Registro de Vacinação**
- Seleção autocomplete de vacinas
- Vinculação automática com paciente
- Registro de próxima dose
- Validação de lotes e validade

#### 4️⃣ **Controle de Acesso**
- Login seguro com JWT
- Perfis ADMIN e USER
- Restrições por funcionalidade
- Sessão com expiração automática

#### 5️⃣ **Gestão de Usuários** (Admin)
- Cadastro de profissionais de saúde
- Definição de cargos e permissões
- Controle de acesso ao sistema

---

## 🎥 GIF Demonstrativo

<!-- Adicione aqui GIFs ou screenshots do sistema em funcionamento -->

```
[Fluxo de Cadastro de Paciente]
Login → Dashboard → Cadastrar Paciente → Preencher Formulário → Sucesso

[Fluxo de Registro de Vacinação]
Buscar Paciente → Ver Detalhes → Registrar Vacinação → Selecionar Vacina → Confirmar

[Fluxo de Visualização de Histórico]
Buscar por CPF → Detalhes do Paciente → Histórico Vacinal com Paginação e Filtros
```

---

## 🛠️ Tecnologias Utilizadas

### **Frontend**
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| HTML5 | - | Estrutura semântica das páginas |
| CSS3 | - | Estilização moderna com variáveis CSS |
| JavaScript (Vanilla) | ES6+ | Lógica de interação e chamadas à API |
| Font Awesome | 6.0.0 | Ícones e elementos visuais |

**Destaques do Frontend:**
- 🎨 Design System consistente com variáveis CSS
- 📱 Layout 100% responsivo (mobile-first)
- 🔄 Paginação client-side para histórico vacinal
- 🔍 Filtros em tempo real com debounce
- ✨ Máscaras automáticas para CPF e telefone
- 🎯 Validações de formulário no client-side

---

### **Backend**
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Java | 21 | Linguagem principal |
| Spring Boot | 3.5.4 | Framework principal |
| Spring Security | 3.5.4 | Autenticação e autorização |
| Spring Data JPA | 3.5.4 | Persistência de dados |
| PostgreSQL | 16.3 | Banco de dados relacional |
| Flyway | 10.10.0 | Migrações de banco de dados |
| JWT (Auth0) | 4.5.0 | Tokens de autenticação |
| MapStruct | 1.5.5 | Mapeamento de DTOs |
| Lombok | 1.18.32 | Redução de boilerplate |
| Springdoc OpenAPI | 2.1.0 | Documentação da API |

**Destaques do Backend:**
- 🏗️ Arquitetura em camadas (Controller → Service → Repository)
- 🔐 Segurança com BCrypt e JWT
- 📊 Soft delete para auditoria
- 🔄 Transações gerenciadas
- 📝 Logging estruturado com SLF4J
- 🚀 Migrações versionadas com Flyway
- 📖 Documentação automática com Swagger

---

### **Ferramentas de Desenvolvimento**
| Ferramenta | Uso |
|------------|-----|
| Maven | Gerenciamento de dependências |
| Docker | Containerização do PostgreSQL |
| Git | Controle de versão |
| IntelliJ IDEA | IDE recomendada |
| Postman | Testes de API |
| VS Code | Editor para frontend |

---

## 🚀 Como Executar

### **Pré-requisitos**
- Java 21+
- PostgreSQL 16+ (ou Docker)
- Maven 3.9+
- Navegador moderno

### **Backend**

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd saude-indigena
```

2. **Configure o banco de dados**
```bash
# Via Docker
docker-compose up -d

# Ou crie manualmente um banco chamado 'saude_indigena'
```

3. **Execute o backend**
```bash
# Windows
.\start_backend.ps1

# Linux/Mac
export APP_NOME="saude-indigena"
export DATABASE_URL="jdbc:postgresql://localhost:5433/saude_indigena"
export DATABASE_USERNAME="postgres"
export DATABASE_PASSWORD="123"
mvn spring-boot:run
```

### **Frontend**

1. **Abra o arquivo HTML**
```bash
cd Front_End
# Abra login.html em um servidor local ou navegador
# Recomendado: usar Live Server do VS Code
```

2. **Credenciais padrão**
```
Criar primeiro admin via endpoint:
POST /auth/register
{
  "usuario": "admin",
  "password": "admin123",
  "role": "ADMIN"
}
```

---

## 📚 Documentação da API

Após iniciar o backend, acesse:
```
http://localhost:8080/api/v1/swagger-ui.html
```

### **Principais Endpoints**

#### **Autenticação**
- `POST /auth/login` - Login de usuário
- `POST /auth/admin/login` - Login de admin
- `POST /auth/register` - Registro de admin

#### **Pacientes**
- `POST /pessoa` - Cadastrar paciente
- `GET /pessoa/{uuid}` - Buscar por UUID
- `POST /pessoa/buscar-por-cpf` - Buscar por CPF
- `GET /pessoa` - Listar (paginado)
- `PUT /pessoa/{uuid}` - Atualizar
- `DELETE /pessoa/{uuid}` - Remover (soft delete)

#### **Vacinas**
- `POST /vacina` - Cadastrar vacina
- `GET /vacina/{uuid}` - Buscar por UUID
- `GET /vacina/all` - Listar todas
- `PUT /vacina/{uuid}` - Atualizar
- `DELETE /vacina/{uuid}` - Remover

#### **Vacinações**
- `POST /vacinacoes/registrar` - Registrar vacinação
- `GET /vacinacoes` - Listar (paginado)
- `GET /vacinacoes/{uuid}` - Buscar por UUID
- `PUT /vacinacoes/{uuid}` - Atualizar
- `DELETE /vacinacoes/{uuid}` - Remover

#### **Usuários** (ADMIN only)
- `POST /usuario` - Cadastrar usuário
- `GET /usuario` - Listar usuários
- `GET /usuario/{uuid}` - Buscar por UUID

---

## 🔒 Segurança

- **JWT com expiração de 2 horas**
- **Senhas criptografadas com BCrypt**
- **CORS configurado**
- **Validações em múltiplas camadas**
- **SQL Injection protegido pelo JPA**
- **Rate limiting no filtro de segurança**

---

## 🎯 Roadmap Futuro

- [ ] Dashboard com gráficos interativos
- [ ] Notificações de doses atrasadas
- [ ] Exportação de relatórios em PDF
- [ ] Integração com e-SUS
- [ ] Aplicativo mobile nativo
- [ ] Sistema de alertas de estoque baixo
- [ ] Módulo de relatórios epidemiológicos
- [ ] Suporte a múltiplos idiomas indígenas

---

## 👥 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença [especificar licença].

---

## 📧 Contato

Para dúvidas ou sugestões, entre em contato através de [seu email ou meio de contato].

---

**Desenvolvido com ❤️ para melhorar a saúde das comunidades indígenas brasileiras**
