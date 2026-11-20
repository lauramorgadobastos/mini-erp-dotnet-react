namespace StockFlow.Api.Models;

public class MovimentacaoEstoque
{
    public uint Id { get; set; }
    public uint ProdutoId { get; set; }
    public string Tipo { get; set; } = string.Empty; // "ENTRADA" ou "SAIDA"
    public int Quantidade { get; set; }
    public decimal ValorUnitario { get; set; }
    public decimal ValorTotal { get; set; }
    public string? Observacao { get; set; }
    public DateTime CriadoEm { get; set; }
}