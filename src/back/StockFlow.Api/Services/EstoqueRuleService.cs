namespace StockFlow.Api.Services;

public record ResultadoCalculoMovimentacao(
    bool Valido,
    string? Erro,
    string TipoNormalizado,
    int NovoEstoque,
    decimal ValorUnitario,
    decimal ValorTotal,
    string TipoFinanceiro
);

public class EstoqueRuleService
{
    public ResultadoCalculoMovimentacao CalcularMovimentacao(
        bool produtoExiste,
        bool produtoAtivo,
        int estoqueAtual,
        decimal precoUnitario,
        decimal custoUnitario,
        string tipo,
        int quantidade,
        decimal? valorUnitarioInformado)
    {
        if (!produtoExiste)
            return new(false, "Produto não encontrado.", string.Empty, 0, 0, 0, string.Empty);

        if (!produtoAtivo)
            return new(false, "Não é possível movimentar um produto inativo.", string.Empty, 0, 0, 0, string.Empty);

        if (quantidade <= 0)
            return new(false, "A quantidade deve ser maior que zero.", string.Empty, 0, 0, 0, string.Empty);

        var tipoNormalizado = tipo.Trim().ToUpperInvariant();
        if (tipoNormalizado is not ("ENTRADA" or "SAIDA"))
            return new(false, "O tipo deve ser ENTRADA ou SAIDA.", string.Empty, 0, 0, 0, string.Empty);

        var novoEstoque = tipoNormalizado == "ENTRADA"
            ? estoqueAtual + quantidade
            : estoqueAtual - quantidade;

        if (novoEstoque < 0)
        {
            return new(
                false,
                $"Saldo insuficiente em estoque. Disponível: {estoqueAtual}, solicitado: {quantidade}.",
                tipoNormalizado,
                0,
                0,
                0,
                string.Empty
            );
        }

        var valorUnitario = valorUnitarioInformado
            ?? (tipoNormalizado == "ENTRADA" ? custoUnitario : precoUnitario);

        var valorTotal = Math.Round(valorUnitario * quantidade, 2, MidpointRounding.AwayFromZero);
        var tipoFinanceiro = tipoNormalizado == "ENTRADA" ? "DESPESA" : "RECEITA";

        return new(
            true,
            null,
            tipoNormalizado,
            novoEstoque,
            valorUnitario,
            valorTotal,
            tipoFinanceiro
        );
    }
}