#  StockFlow ERP — Módulo de Banco de Dados (MySQL 8.x)

> Camada de persistência relacional do **StockFlow ERP**, projetada para garantir consistência transacional (ACID), integridade referencial rigorosa para estoque e rastreabilidade financeira.

---

##  Arquitetura e Estrutura de Arquivos

```text
src/db/
├── docker-compose.yml          # Provisionamento isolado do MySQL 8.0 via container
├── README.md                   # Documentação técnica da camada de dados
└── scripts/
    ├── CREATE_SCHEMA.sql       # Script DDL (criação da base, tabelas, constraints e índices)
    └── SEED.sql                # Script DML (dados mockados para desenvolvimento e testes)
```

---

## Modelo de Dados (Dicionário de Tabelas)

### 1. `produtos`
Representa o catálogo de itens comercializados ou gerenciados pela aplicação.

* **`id`** (`INT UNSIGNED`, PK, AUTO_INCREMENT): Identificador único do produto.
* **`sku`** (`VARCHAR(40)`, UNIQUE, NOT NULL): Código de controle de estoque (*Stock Keeping Unit*).
* **`nome`** (`VARCHAR(120)`, NOT NULL): Nome comercial do produto.
* **`descricao`** (`VARCHAR(500)`): Detalhes técnicos ou observações adicionais.
* **`preco_unitario`** (`DECIMAL(12,2)`, NOT NULL): Preço de venda praticado (`CHECK >= 0`).
* **`custo_unitario`** (`DECIMAL(12,2)`, NOT NULL): Custo de aquisição/produção (`CHECK >= 0`).
* **`quantidade_estoque`** (`INT`, NOT NULL, DEFAULT 0): Saldo físico atual em estoque.
* **`estoque_minimo`** (`INT`, NOT NULL, DEFAULT 5): Margem de segurança para alertas de reposição.
* **`ativo`** (`TINYINT(1)`, NOT NULL, DEFAULT 1): Flag de *soft delete* (`1` = Ativo, `0` = Inativo).
* **`criado_em` / `atualizado_em`** (`DATETIME`): *Timestamps* auditados automaticamente.

### 2. `movimentacoes_estoque`
Registro de entradas, saídas e ajustes de saldo dos produtos.

* **`id`** (`INT UNSIGNED`, PK, AUTO_INCREMENT): Identificador único da movimentação.
* **`produto_id`** (`INT UNSIGNED`, FK `produtos.id`, `ON DELETE RESTRICT`): Produto afetado.
* **`tipo`** (`ENUM('ENTRADA', 'SAIDA', 'AJUSTE')`, NOT NULL): Natureza da operação.
* **`quantidade`** (`INT`, NOT NULL): Volume movimentado (`CHECK > 0`).
* **`observacao`** (`VARCHAR(255)`): Justificativa ou número da nota/pedido associado.
* **`criado_em`** (`DATETIME`, NOT NULL): Data e hora exatas do registro.

### 3. `lancamentos_financeiros`
Controle do fluxo de caixa (contas a receber e contas a pagar).

* **`id`** (`INT UNSIGNED`, PK, AUTO_INCREMENT): Identificador único do lançamento.
* **`descricao`** (`VARCHAR(150)`, NOT NULL): Título/Histórico da transação.
* **`categoria`** (`VARCHAR(60)`, NOT NULL): Agrupamento financeiro (ex.: *Vendas*, *Infraestrutura*).
* **`tipo`** (`ENUM('RECEITA', 'DESPESA')`, NOT NULL): Direção do fluxo financeiro.
* **`status`** (`ENUM('PENDENTE', 'PAGO', 'CANCELADO')`, DEFAULT `'PENDENTE'`): Situação da conta.
* **`valor`** (`DECIMAL(12,2)`, NOT NULL): Montante financeiro (`CHECK > 0`).
* **`data_vencimento`** (`DATE`, NOT NULL): Data prevista para liquidação.
* **`data_pagamento`** (`DATE`): Data efetiva da liquidação (preenchida quando `status = 'PAGO'`).
* **`observacao`** (`VARCHAR(255)`): Detalhes sobre o meio de pagamento ou observações gerais.

---

##  Boas Práticas e Decisões Arquiteturais

1. **Garantia de Integridade Financeira (`DECIMAL`):**
   Valores monetários (`preco_unitario`, `custo_unitario`, `valor`) utilizam estritamente o tipo `DECIMAL(12,2)` para evitar erros de arredondamento de ponto flutuante binário (`FLOAT`/`DOUBLE`).
2. **Soft Delete & Preservação Histórica:**
   Produtos possuem a flag `ativo`. A chave estrangeira `fk_movimentacoes_produto` utiliza `ON DELETE RESTRICT` para impedir a exclusão física de um produto que já possua histórico de movimentação.
3. **Indexação Estratégica:**
   Foram adicionados índices secundários em colunas consultadas com frequência pela API (`produtos.nome`, `produtos.ativo`, `movimentacoes_estoque.produto_id`, `lancamentos_financeiros.data_vencimento`, `lancamentos_financeiros.status`) para otimizar as consultas de filtragem e relatórios.

---

##  Como Executar

### Opção A: MySQL Local (Recomendado para Desenvolvimento)

Se você já possui o serviço do MySQL rodando localmente na máquina:

1. Acesse seu cliente MySQL (MySQL Workbench, extensão do MySQL no VS Code ou CLI):
   ```bash
   mysql -u root -p
   ```
2. Execute o script DDL de criação do banco e tabelas:
   ```bash
   mysql -u root -p < scripts/CREATE_SCHEMA.sql
   ```
3. Execute o script DML de carga inicial de dados:
   ```bash
   mysql -u root -p < scripts/SEED.sql
   ```

### Opção B: Docker Compose (Ambiente Isolado)

Se preferir subir o MySQL conteinerizado sem instalar o banco na máquina hospedeira:

```bash
cd src/db
docker compose up -d
```

O contêiner subirá na porta `3306` com as variáveis configuradas em `docker-compose.yml` e executará automaticamente o script `CREATE_SCHEMA.sql` contido em `/docker-entrypoint-initdb.d/` no primeiro boot.

---

##  Consultas de Validação (Smoke Test)

Após a carga inicial do `SEED.sql`, você pode rodar os seguintes comandos para verificar a integridade dos dados:

```sql
USE stockflow_db;

-- 1. Verificar estoque baixo (produtos com saldo <= estoque mínimo)
SELECT id, sku, nome, quantidade_estoque, estoque_minimo
FROM produtos
WHERE quantidade_estoque <= estoque_minimo AND ativo = 1;

-- 2. Histórico de movimentações por produto
SELECT p.nome, m.tipo, m.quantidade, m.observacao, m.criado_em
FROM movimentacoes_estoque m
JOIN produtos p ON p.id = m.produto_id
ORDER BY m.criado_em DESC;

-- 3. Resumo financeiro por status
SELECT tipo, status, SUM(valor) AS total
FROM lancamentos_financeiros
GROUP BY tipo, status;
```

---

## Troubleshooting e Solução de Problemas

* **Erro de encoding/acentuação no MySQL:**
  O banco utiliza `utf8mb4` com collation `utf8mb4_unicode_ci`. Certifique-se de que a conexão do seu cliente SQL ou string de conexão da API especifica `CharSet=utf8mb4`.
* **Erro de chave estrangeira ao rodar o `SEED.sql`:**
  O script `SEED.sql` desativa temporariamente a checagem de FKs (`SET FOREIGN_KEY_CHECKS = 0;`) no topo para permitir a limpeza (`TRUNCATE`) das tabelas. Garanta que o script seja executado do início ao fim no mesmo escopo de sessão.