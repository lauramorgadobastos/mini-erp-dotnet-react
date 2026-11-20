namespace StockFlow.Api.DTOs;

public record DashboardResumoDto(
    int TotalProdutos,
    int ProdutosComEstoqueBaixo,
    int TotalQuantidadeEstoque,
    decimal ValorTotalEstoque,
    decimal TotalReceitas,
    decimal TotalDespesas,
    decimal SaldoFinanceiro
);

public record ProdutoEstoqueBaixoDto(
    uint Id,
    string Sku,
    string Nome,
    int QuantidadeEstoque,
    int EstoqueMinimo
);