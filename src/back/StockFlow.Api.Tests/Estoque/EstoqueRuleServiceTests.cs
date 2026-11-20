using FluentAssertions;
using StockFlow.Api.Services;

namespace StockFlow.Api.Tests.Estoque;

public class EstoqueRuleServiceTests
{
    private readonly EstoqueRuleService _sut = new(); // SUT = System Under Test

    [Fact]
    public void CalcularMovimentacao_EntradaValida_DeveSomarEstoqueEGerarDespesa()
    {
        // Arrange
        const int estoqueAtual = 10;
        const int quantidade = 5;
        const decimal custoUnitario = 18.00m;

        // Act
        var resultado = _sut.CalcularMovimentacao(
            produtoExiste: true,
            produtoAtivo: true,
            estoqueAtual: estoqueAtual,
            precoUnitario: 45.00m,
            custoUnitario: custoUnitario,
            tipo: "entrada",
            quantidade: quantidade,
            valorUnitarioInformado: null
        );

        // Assert
        resultado.Valido.Should().BeTrue();
        resultado.Erro.Should().BeNull();
        resultado.TipoNormalizado.Should().Be("ENTRADA");
        resultado.NovoEstoque.Should().Be(15);
        resultado.ValorUnitario.Should().Be(18.00m);
        resultado.ValorTotal.Should().Be(90.00m);
        resultado.TipoFinanceiro.Should().Be("DESPESA");
    }

    [Fact]
    public void CalcularMovimentacao_SaidaValida_DeveSubtrairEstoqueEGerarReceita()
    {
        // Arrange & Act
        var resultado = _sut.CalcularMovimentacao(
            produtoExiste: true,
            produtoAtivo: true,
            estoqueAtual: 20,
            precoUnitario: 45.00m,
            custoUnitario: 18.00m,
            tipo: "SAIDA",
            quantidade: 4,
            valorUnitarioInformado: null
        );

        // Assert
        resultado.Valido.Should().BeTrue();
        resultado.NovoEstoque.Should().Be(16);
        resultado.ValorUnitario.Should().Be(45.00m);
        resultado.ValorTotal.Should().Be(180.00m);
        resultado.TipoFinanceiro.Should().Be("RECEITA");
    }

    [Fact]
    public void CalcularMovimentacao_SaidaMaiorQueEstoque_DeveFalharPorSaldoInsuficiente()
    {
        // Arrange & Act
        var resultado = _sut.CalcularMovimentacao(
            produtoExiste: true,
            produtoAtivo: true,
            estoqueAtual: 3,
            precoUnitario: 45.00m,
            custoUnitario: 18.00m,
            tipo: "SAIDA",
            quantidade: 5,
            valorUnitarioInformado: null
        );

        // Assert
        resultado.Valido.Should().BeFalse();
        resultado.Erro.Should().Contain("Saldo insuficiente");
    }

    [Fact]
    public void CalcularMovimentacao_ProdutoInativo_DeveRetornarErro()
    {
        // Arrange & Act
        var resultado = _sut.CalcularMovimentacao(
            produtoExiste: true,
            produtoAtivo: false,
            estoqueAtual: 10,
            precoUnitario: 45.00m,
            custoUnitario: 18.00m,
            tipo: "ENTRADA",
            quantidade: 2,
            valorUnitarioInformado: null
        );

        // Assert
        resultado.Valido.Should().BeFalse();
        resultado.Erro.Should().Contain("inativo");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-3)]
    public void CalcularMovimentacao_QuantidadeMenorOuIgualAZero_DeveRetornarErro(int quantidadeInvalida)
    {
        // Arrange & Act
        var resultado = _sut.CalcularMovimentacao(
            produtoExiste: true,
            produtoAtivo: true,
            estoqueAtual: 10,
            precoUnitario: 45.00m,
            custoUnitario: 18.00m,
            tipo: "ENTRADA",
            quantidade: quantidadeInvalida,
            valorUnitarioInformado: null
        );

        // Assert
        resultado.Valido.Should().BeFalse();
        resultado.Erro.Should().Contain("maior que zero");
    }
}