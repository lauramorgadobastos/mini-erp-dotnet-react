using System.ComponentModel.DataAnnotations;

namespace StockFlow.Api.DTOs;

public record CriarMovimentacaoDto(
    [Required(ErrorMessage = "O ID do produto é obrigatório.")]
    [Range(1, uint.MaxValue, ErrorMessage = "O ID do produto deve ser maior que zero.")]
    uint ProdutoId,

    [Required(ErrorMessage = "O tipo da movimentação é obrigatório.")]
    [RegularExpression("^(ENTRADA|SAIDA)$", ErrorMessage = "O tipo deve ser ENTRADA ou SAIDA.")]
    string Tipo,

    [Required(ErrorMessage = "A quantidade é obrigatória.")]
    [Range(1, int.MaxValue, ErrorMessage = "A quantidade deve ser maior que zero.")]
    int Quantidade,

    [Range(0, double.MaxValue, ErrorMessage = "O valor unitário deve ser maior ou igual a zero.")]
    decimal? ValorUnitario,

    [StringLength(300, ErrorMessage = "A observação não pode exceder 300 caracteres.")]
    string? Observacao
);