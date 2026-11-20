USE stockflow_db;

-- Desativa temporariamente a checagem de chaves estrangeiras para limpeza/carga
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE movimentacoes_estoque;
TRUNCATE TABLE lancamentos_financeiros;
TRUNCATE TABLE produtos;
SET FOREIGN_KEY_CHECKS = 1;

-- Carga Inicial de Produtos
INSERT INTO produtos (id, sku, nome, descricao, preco_unitario, custo_unitario, quantidade_estoque, estoque_minimo, ativo) VALUES
(1, 'PROD-NOTE-001', 'Notebook Dell Inspiron 15', 'Intel Core i5, 16GB RAM, SSD 512GB', 3899.90, 2900.00, 12, 5, 1),
(2, 'PROD-MON-002', 'Monitor LG UltraGear 27"', 'IPS, Full HD, 144Hz, 1ms', 1299.00, 850.00, 3, 5, 1), -- Exemplo com estoque baixo!
(3, 'PROD-TECL-003', 'Teclado Mecânico Redragon', 'Switch Blue, RGB, Layout ABNT2', 249.90, 130.00, 25, 10, 1),
(4, 'PROD-MOUSE-004', 'Mouse Sem Fio Logitech MX Master 3S', 'Ergonômico, 8K DPI, Conexão Bluetooth/USB', 549.00, 380.00, 8, 3, 1),
(5, 'PROD-CABO-005', 'Cabo HDMI 2.1 4K 2m', 'Cabo de alta velocidade trançado', 45.00, 18.00, 0, 10, 0); -- Produto inativo e sem estoque

--  Carga Inicial de Movimentações de Estoque
INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, observacao, criado_em) VALUES
(1, 'ENTRADA', 15, 'Lote inicial enviado pelo fornecedor', NOW() - INTERVAL 10 DAY),
(1, 'SAIDA', 3, 'Venda para cliente final - Pedido #1001', NOW() - INTERVAL 5 DAY),
(2, 'ENTRADA', 5, 'Lote inicial de reposição', NOW() - INTERVAL 8 DAY),
(2, 'SAIDA', 2, 'Venda para cliente corporativo - Pedido #1002', NOW() - INTERVAL 2 DAY),
(3, 'ENTRADA', 30, 'Carga inicial de estoque', NOW() - INTERVAL 12 DAY),
(3, 'SAIDA', 5, 'Vendas avulsas de balcão', NOW() - INTERVAL 1 DAY);

--  Carga Inicial de Lançamentos Financeiros
INSERT INTO lancamentos_financeiros (descricao, categoria, tipo, status, valor, data_vencimento, data_pagamento, observacao) VALUES
('Venda Pedido #1001', 'Vendas', 'RECEITA', 'PAGO', 3899.90, CURDATE() - INTERVAL 5 DAY, CURDATE() - INTERVAL 5 DAY, 'Pagamento via Pix'),
('Venda Pedido #1002', 'Vendas', 'RECEITA', 'PENDENTE', 2598.00, CURDATE() + INTERVAL 10 DAY, NULL, 'Faturamento para 30 dias'),
('Pagamento Fornecedor Dell', 'Fornecedores', 'DESPESA', 'PAGO', 14500.00, CURDATE() - INTERVAL 8 DAY, CURDATE() - INTERVAL 8 DAY, 'Compra de lotes de notebooks'),
('Aluguel do Galpão', 'Infraestrutura', 'DESPESA', 'PENDENTE', 2500.00, CURDATE() + INTERVAL 5 DAY, NULL, 'Vencimento mensal recorrente'),
('Serviço de Internet Fibra', 'Utilitários', 'DESPESA', 'PAGO', 199.90, CURDATE() - INTERVAL 2 DAY, CURDATE() - INTERVAL 2 DAY, 'Debito automático');