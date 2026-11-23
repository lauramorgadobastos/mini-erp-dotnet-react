CREATE DATABASE IF NOT EXISTS stockflow_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE stockflow_db;

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(40) NOT NULL,
    nome VARCHAR(120) NOT NULL,
    descricao VARCHAR(500) NULL,
    preco_unitario DECIMAL(12, 2) NOT NULL,
    custo_unitario DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    quantidade_estoque INT NOT NULL DEFAULT 0,
    estoque_minimo INT NOT NULL DEFAULT 5,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_produtos_sku UNIQUE (sku),
    CONSTRAINT chk_produtos_preco CHECK (preco_unitario >= 0),
    CONSTRAINT chk_produtos_custo CHECK (custo_unitario >= 0),
    CONSTRAINT chk_produtos_estoque_min CHECK (estoque_minimo >= 0),
    INDEX idx_produtos_nome (nome),
    INDEX idx_produtos_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Carga Inicial de Produtos
INSERT INTO produtos (id, sku, nome, descricao, preco_unitario, custo_unitario, quantidade_estoque, estoque_minimo, ativo) VALUES
(1, 'PROD-NOTE-001', 'Notebook Dell Inspiron 15', 'Intel Core i5, 16GB RAM, SSD 512GB', 3899.90, 2900.00, 12, 5, 1),
(2, 'PROD-MON-002', 'Monitor LG UltraGear 27"', 'IPS, Full HD, 144Hz, 1ms', 1299.00, 850.00, 3, 5, 1), -- Exemplo com estoque baixo!
(3, 'PROD-TECL-003', 'Teclado Mecânico Redragon', 'Switch Blue, RGB, Layout ABNT2', 249.90, 130.00, 25, 10, 1),
(4, 'PROD-MOUSE-004', 'Mouse Sem Fio Logitech MX Master 3S', 'Ergonômico, 8K DPI, Conexão Bluetooth/USB', 549.00, 380.00, 8, 3, 1),
(5, 'PROD-CABO-005', 'Cabo HDMI 2.1 4K 2m', 'Cabo de alta velocidade trançado', 45.00, 18.00, 0, 10, 0); -- Produto inativo e sem estoque

-- Tabela de Movimentacoes de Estoque
DROP TABLE IF EXISTS movimentacoes_estoque;

CREATE TABLE movimentacoes_estoque (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    produto_id INT UNSIGNED NOT NULL,
    tipo ENUM('ENTRADA', 'SAIDA', 'AJUSTE') NOT NULL,
    quantidade INT NOT NULL,
    valor_unitario DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    valor_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    observacao VARCHAR(300) NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_movimentacoes_quantidade CHECK (quantidade > 0),
    CONSTRAINT chk_movimentacoes_valor_un CHECK (valor_unitario >= 0),
    CONSTRAINT chk_movimentacoes_valor_tot CHECK (valor_total >= 0),
    CONSTRAINT fk_movimentacoes_produto
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    INDEX idx_movimentacoes_produto (produto_id),
    INDEX idx_movimentacoes_tipo (tipo),
    INDEX idx_movimentacoes_criado_em (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Carga inicial atualizada com os valores unitário e total
INSERT INTO movimentacoes_estoque
(produto_id, tipo, quantidade, valor_unitario, valor_total, observacao, criado_em)
VALUES
(1, 'ENTRADA', 15, 2900.00, 43500.00, 'Lote inicial enviado pelo fornecedor', NOW() - INTERVAL 10 DAY),
(1, 'SAIDA', 3, 3899.90, 11699.70, 'Venda para cliente final - Pedido #1001', NOW() - INTERVAL 5 DAY),
(2, 'ENTRADA', 5, 850.00, 4250.00, 'Lote inicial de reposição', NOW() - INTERVAL 8 DAY),
(2, 'SAIDA', 2, 1299.00, 2598.00, 'Venda para cliente corporativo - Pedido #1002', NOW() - INTERVAL 2 DAY),
(3, 'ENTRADA', 30, 130.00, 3900.00, 'Carga inicial de estoque', NOW() - INTERVAL 12 DAY),
(3, 'SAIDA', 5, 249.90, 1249.50, 'Vendas avulsas de balcão', NOW() - INTERVAL 1 DAY);

-- Tabela de Lancamentos Financeiros

CREATE TABLE IF NOT EXISTS lancamentos_financeiros (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(150) NOT NULL,
    categoria VARCHAR(60) NOT NULL,
    tipo ENUM('RECEITA', 'DESPESA') NOT NULL,
    status ENUM('PENDENTE', 'PAGO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    valor DECIMAL(12, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE NULL,
    observacao VARCHAR(255) NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_lancamentos_valor CHECK (valor > 0),
    INDEX idx_lancamentos_tipo (tipo),
    INDEX idx_lancamentos_status (status),
    INDEX idx_lancamentos_vencimento (data_vencimento),
    INDEX idx_lancamentos_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--  Carga Inicial de Lançamentos Financeiros
INSERT INTO lancamentos_financeiros (descricao, categoria, tipo, status, valor, data_vencimento, data_pagamento, observacao) VALUES
('Venda Pedido #1001', 'Vendas', 'RECEITA', 'PAGO', 3899.90, CURDATE() - INTERVAL 5 DAY, CURDATE() - INTERVAL 5 DAY, 'Pagamento via Pix'),
('Venda Pedido #1002', 'Vendas', 'RECEITA', 'PENDENTE', 2598.00, CURDATE() + INTERVAL 10 DAY, NULL, 'Faturamento para 30 dias'),
('Pagamento Fornecedor Dell', 'Fornecedores', 'DESPESA', 'PAGO', 14500.00, CURDATE() - INTERVAL 8 DAY, CURDATE() - INTERVAL 8 DAY, 'Compra de lotes de notebooks'),
('Aluguel do Galpão', 'Infraestrutura', 'DESPESA', 'PENDENTE', 2500.00, CURDATE() + INTERVAL 5 DAY, NULL, 'Vencimento mensal recorrente'),
('Serviço de Internet Fibra', 'Utilitários', 'DESPESA', 'PAGO', 199.90, CURDATE() - INTERVAL 2 DAY, CURDATE() - INTERVAL 2 DAY, 'Debito automático');