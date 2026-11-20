#  StockFlow.Api — Módulo Back-end RESTful API

O **StockFlow.Api** é o serviço de back-end do Mini-ERP **StockFlow**, construído com **.NET 10 Web API** e **MySQL 8.x**. O projeto segue uma organização em camadas (Controllers, DTOs, Models, Repositories e Services) para manter o código modular, testável e fácil de evoluir.

---

##  Tecnologias e Bibliotecas

- **Framework:** .NET 10 (ASP.NET Core Web API)
- **Banco de Dados:** MySQL 8.x
- **Acesso a Dados:** `MySqlConnector` (ADO.NET assíncrono com controle de transações)
- **Testes Unitários:** `xUnit` + `FluentAssertions`
- **Documentação / Inspeção:** OpenAPI / Swagger UI

---

##  Estrutura do Back-end

A solução fica organizada em `src/back/`, separando a API e o projeto de testes unitários:

```text
src/back/
├── StockFlow.Api/
│   ├── Controllers/          # Endpoints HTTP REST (rotas, status codes e respostas)
│   ├── DTOs/                 # Contratos de entrada/saída e validações com DataAnnotations
│   ├── Models/               # Entidades de domínio mapeadas para as tabelas do banco
│   ├── Repositories/         # Consultas SQL parametrizadas e transações ACID no MySQL
│   ├── Services/             # Regras de negócio puras (cálculos e validações sem banco)
│   ├── Properties/           # Configurações de inicialização (launchSettings.json)
│   ├── Program.cs            # Registro de dependências, middlewares e pipeline HTTP
│   ├── appsettings.json      # Configurações padrão e template de connection string
│   └── StockFlow.Api.csproj  # Configuração do projeto .NET 10
└── StockFlow.Api.Tests/
    ├── Estoque/              # Testes unitários das regras do módulo de estoque
    └── StockFlow.Api.Tests.csproj

##  Módulos e Endpoints

### 1. Produtos (`/api/produtos`)
- `GET /api/produtos?incluirInativos=true` — Lista os produtos cadastrados (com opção de ocultar inativos).
- `GET /api/produtos/{id}` — Busca um produto específico pelo ID.
- `POST /api/produtos` — Cadastra um novo produto, normalizando o SKU e validando duplicidade (`409 Conflict`).
- `PUT /api/produtos/{id}` — Atualiza os dados de um produto existente.
- `PATCH /api/produtos/{id}/status?ativo=true` — Ativa ou inativa um produto.

### 2. Movimentações de Estoque (`/api/movimentacoes`)
- `GET /api/movimentacoes` — Lista o histórico de movimentações (`ENTRADA` e `SAIDA`).
- `POST /api/movimentacoes` — Registra uma movimentação dentro de uma transação MySQL (`MySqlTransaction`):
  - Valida existência e status ativo do produto.
  - Verifica se há saldo suficiente em caso de `SAIDA`.
  - Atualiza `quantidade_estoque` em `produtos`.
  - Insere o registro em `movimentacoes_estoque`.
  - Gera o lançamento correspondente em `lancamentos_financeiros` (`DESPESA` para `ENTRADA` e `RECEITA` para `SAIDA`).
  - Executa `Rollback` automático em caso de erro ou saldo insuficiente.

### 3. Lançamentos Financeiros (`/api/financeiro`)
- `GET /api/financeiro?tipo=RECEITA` — Lista os lançamentos financeiros, com filtro opcional por `tipo` (`RECEITA` ou `DESPESA`).

### 4. Dashboard (`/api/dashboard`)
- `GET /api/dashboard/resumo` — Retorna os indicadores consolidados de estoque e financeiro (total de produtos ativos, produtos com estoque baixo, quantidade total em estoque, valor total em estoque, total de receitas, total de despesas e saldo financeiro).
- `GET /api/dashboard/alertas-estoque` — Lista os produtos ativos com `quantidade_estoque <= estoque_minimo`.

---

##  Testes Unitários

Os testes unitários ficam em `src/back/StockFlow.Api.Tests/` e cobrem as regras puras de movimentação de estoque (`EstoqueRuleService`) utilizando o padrão **Arrange / Act / Assert**:

- Cálculo de `ENTRADA` somando saldo e gerando `DESPESA`.
- Cálculo de `SAIDA` subtraindo saldo e gerando `RECEITA`.
- Bloqueio quando a quantidade de `SAIDA` excede o estoque disponível.
- Bloqueio para produto inativo ou quantidade menor/igual a zero.

Para executar:

```powershell
cd src/back/StockFlow.Api.Tests
dotnet build
dotnet test --no-build
```

## Como Testar Localmente

### Pré-requisitos
* **.NET 10 SDK** instalado.
* **MySQL 8.x** em execução com o banco configurado pelos scripts da pasta `src/database/`.

### Configuração Local
### Configuração Local (`.env.example` → `.env`)
Na pasta `src/back/`, há um arquivo de modelo `.env.example` com as variáveis esperadas pela aplicação:

- `PORT` (ex.: `5000`)
- `DB_HOST` (ex.: `localhost`)
- `DB_PORT` (ex.: `3306`)
- `DB_NAME` (ex.: `stockflow_db`)
- `DB_USER` (ex.: `root`)
- `DB_PASSWORD`

Para configurar seu ambiente local sem expor credenciais no Git:
1. Copie `.env.example` para `.env` dentro de `src/back/`:
   ```powershell
   cd src/back
   Copy-Item .env.example .env
   ```
2. Abra o arquivo .env e preencha os valores reais do seu ambiente local (especialmente DB_PASSWORD). O .env deve permanecer ignorado pelo .gitignore.

### Compilar e Executar a API
Na pasta `src/back/StockFlow.Api`, execute os comandos abaixo para compilar e iniciar a aplicação sem rebuild no momento da execução:

```bash
cd src/back/StockFlow.Api
dotnet build
dotnet run --no-build
```

A API fica disponível por padrão em http://localhost:5080 (conforme configurado em Properties/launchSettings.json).

### Rodar os Testes Unitários
Na pasta `src/back/StockFlow.Api.Tests`, execute:

```bash
cd src/back/StockFlow.Api.Tests
dotnet build
dotnet test --no-build
```