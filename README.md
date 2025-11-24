# YaraVac 💉

**Sistema inteligente de gerenciamento de vacinação para comunidades remotas**

---

## 📋 Sobre o Projeto

### Descrição Breve
YaraVac é uma solução completa de gestão de vacinação desenvolvida especialmente para atender comunidades remotas. O sistema permite o cadastro de pacientes, registro de vacinações e acompanhamento do histórico vacinal de forma simples e intuitiva.

### 🌟 O Que Torna Isso Especial
- **Foco em Comunidades Remotas**: Sistema pensado para as necessidades específicas das populações distantes, com campos para etnia, comunidade e características
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
- **Arquitetura REST** com documentação Swagger/OpenAPI
- **Paginação Inteligente**: Sistema de listagem com filtros e busca
- **Validações Robustas**: Verificação de CPF, CNS e dados obrigatórios

---

## 🎬 Demonstração

https://github.com/user-attachments/assets/ec50b3f5-8cb1-4423-be83-1c39c1500e60


### Funcionalidades Principais

#### 1️⃣ **Dashboard Intuitivo**
- Visão geral com estatísticas de vacinação
- Ações rápidas para cadastros
- Busca inteligente de pacientes

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
| Springdoc OpenAPI | 2.1.0 | Documentação da API |

**Destaques do Backend:**
- 🏗️ Arquitetura em camadas (Controller → Service → Repository)
- 🔐 Segurança com BCrypt e JWT
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
| IntelliJ IDEA | IDE |
| Postman | Testes de API |
| VS Code | Editor para frontend |

---

## 🚀 Como Executar

### **Pré-requisitos**
- Java 21+
- PostgreSQL 16+ (ou Docker)
- Maven 3.9+

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
- `DELETE /pessoa/{uuid}` - Remover

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

---

## 👨‍💻 Autores

Projeto desenvolvido por quatro integrantes:

| Nome | GitHub | LinkedIn | E-mail |
|------|--------|----------|--------|
| **Igor Santiago de Carvalho** | [IgorSan1](https://github.com/IgorSan1) | [Igor Santaigo](www.linkedin.com/in/igor-santiagoyt) | igor.sancar22@gmail.com |
| **Alexandre Izumi Filho** | [Alexandre](https://github.com/Alex1zum1) | [Alexandre Izumi](https://www.linkedin.com/in/alexandre-izumi-3428b227b) | alexandreizumifilho@gmail.com |
| **Vinicius Oliveira de Souza** | [Vinicius Oliveira](https://github.com/Vinicius7979) | [Vinicius Oliveira](https://www.linkedin.com/in/vinicius-oliveira-609804302) | iliveiravinicius2503@gmail.com |
| **Bruno Rene Batista Goncalves** | [Bruno Rene](https://github.com/Brunorbg) | [Bruno Rene](https://www.linkedin.com/in/bruno-gonçalves-2978a3145) | brunorbgoncalves@gmail.com |

Agradecimentos Especiais a nossa Orientadora:
| Nome | GitHub | LinkedIn | E-mail |
|------|--------|----------|--------|
| **Luana Magalhães Leal** | [Luana Leal](https://github.com/ProfaLuanaLeal) | [Luana Leal](https://www.linkedin.com/in/luanalealm) | prof.luanalealm@gmail.com |
