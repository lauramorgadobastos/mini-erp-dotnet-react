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

-- Tabela de Movimentacoes de Estoque
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    produto_id INT UNSIGNED NOT NULL,
    tipo ENUM('ENTRADA', 'SAIDA', 'AJUSTE') NOT NULL,
    quantidade INT NOT NULL,
    observacao VARCHAR(255) NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_movimentacoes_quantidade CHECK (quantidade > 0),
    CONSTRAINT fk_movimentacoes_produto
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    INDEX idx_movimentacoes_produto (produto_id),
    INDEX idx_movimentacoes_tipo (tipo),
    INDEX idx_movimentacoes_criado_em (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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