namespace StockFlow.Api.Models;

public class LancamentoFinanceiro
{
    public uint Id { get; set; }
    public string Tipo { get; set; } = string.Empty; // "RECEITA" ou "DESPESA"
    public string Origem { get; set; } = string.Empty; // "ESTOQUE" ou "MANUAL"
    public uint? MovimentacaoId { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public DateTime CriadoEm { get; set; }
}