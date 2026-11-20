using System.ComponentModel.DataAnnotations;

namespace StockFlow.Api.DTOs;

public record CriarProdutoDto(
    [Required(ErrorMessage = "O SKU é obrigatório.")]
    [StringLength(40, ErrorMessage = "O SKU não pode exceder 40 caracteres.")]
    string Sku,

    [Required(ErrorMessage = "O nome é obrigatório.")]
    [StringLength(120, ErrorMessage = "O nome não pode exceder 120 caracteres.")]
    string Nome,

    [StringLength(500, ErrorMessage = "A descrição não pode exceder 500 caracteres.")]
    string? Descricao,

    [Range(0, double.MaxValue, ErrorMessage = "O preço unitário deve ser maior ou igual a zero.")]
    decimal PrecoUnitario,

    [Range(0, double.MaxValue, ErrorMessage = "O custo unitário deve ser maior ou igual a zero.")]
    decimal CustoUnitario,

    [Range(0, int.MaxValue, ErrorMessage = "A quantidade inicial em estoque deve ser maior ou igual a zero.")]
    int QuantidadeEstoque,

    [Range(0, int.MaxValue, ErrorMessage = "O estoque mínimo deve ser maior ou igual a zero.")]
    int EstoqueMinimo = 5
);

public record AtualizarProdutoDto(
    [Required(ErrorMessage = "O nome é obrigatório.")]
    [StringLength(120, ErrorMessage = "O nome não pode exceder 120 caracteres.")]
    string Nome,

    [StringLength(500, ErrorMessage = "A descrição não pode exceder 500 caracteres.")]
    string? Descricao,

    [Range(0, double.MaxValue, ErrorMessage = "O preço unitário deve ser maior ou igual a zero.")]
    decimal PrecoUnitario,

    [Range(0, double.MaxValue, ErrorMessage = "O custo unitário deve ser maior ou igual a zero.")]
    decimal CustoUnitario,

    [Range(0, int.MaxValue, ErrorMessage = "O estoque mínimo deve ser maior ou igual a zero.")]
    int EstoqueMinimo,

    bool Ativo
);