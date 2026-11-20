using MySqlConnector;
using StockFlow.Api.DTOs;
using StockFlow.Api.Models;

namespace StockFlow.Api.Repositories;

public class FinanceiroRepository
{
    private readonly IConfiguration _configuration;

    public FinanceiroRepository(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    private MySqlConnection GetConnection() =>
        new(_configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' não configurada."));

    public async Task<IEnumerable<LancamentoFinanceiro>> ObterTodosAsync(string? tipo = null)
    {
        var lista = new List<LancamentoFinanceiro>();
        await using var conn = GetConnection();
        await conn.OpenAsync();

        var tipoNormalizado = string.IsNullOrWhiteSpace(tipo) ? null : tipo.Trim().ToUpperInvariant();

        var sql = tipoNormalizado is null
            ? @"SELECT id, tipo, origem, movimentacao_id, descricao, valor, criado_em
                FROM lancamentos_financeiros
                ORDER BY criado_em DESC, id DESC;"
            : @"SELECT id, tipo, origem, movimentacao_id, descricao, valor, criado_em
                FROM lancamentos_financeiros
                WHERE tipo = @Tipo
                ORDER BY criado_em DESC, id DESC;";

        await using var cmd = new MySqlCommand(sql, conn);
        if (tipoNormalizado is not null)
            cmd.Parameters.AddWithValue("@Tipo", tipoNormalizado);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new LancamentoFinanceiro
            {
                Id = reader.GetUInt32("id"),
                Tipo = reader.GetString("tipo"),
                Origem = reader.GetString("origem"),
                MovimentacaoId = reader.IsDBNull(reader.GetOrdinal("movimentacao_id"))
                    ? null
                    : reader.GetUInt32("movimentacao_id"),
                Descricao = reader.GetString("descricao"),
                Valor = reader.GetDecimal("valor"),
                CriadoEm = reader.GetDateTime("criado_em")
            });
        }

        return lista;
    }

    public async Task<DashboardResumoDto> ObterResumoDashboardAsync()
    {
        await using var conn = GetConnection();
        await conn.OpenAsync();

        const string sqlEstoque = @"SELECT
                                    COUNT(*) AS total_produtos,
                                    COALESCE(SUM(CASE WHEN quantidade_estoque <= estoque_minimo THEN 1 ELSE 0 END), 0) AS estoque_baixo,
                                    COALESCE(SUM(quantidade_estoque), 0) AS total_quantidade,
                                    COALESCE(SUM(quantidade_estoque * preco_unitario), 0) AS valor_estoque
                                  FROM produtos
                                  WHERE ativo = 1;";

        int totalProdutos = 0;
        int estoqueBaixo = 0;
        int totalQuantidade = 0;
        decimal valorEstoque = 0m;

        await using (var cmd = new MySqlCommand(sqlEstoque, conn))
        await using (var reader = await cmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                totalProdutos = reader.GetInt32("total_produtos");
                estoqueBaixo = Convert.ToInt32(reader.GetDecimal("estoque_baixo"));
                totalQuantidade = Convert.ToInt32(reader.GetDecimal("total_quantidade"));
                valorEstoque = reader.GetDecimal("valor_estoque");
            }
        }

        const string sqlFinanceiro = @"SELECT
                                       COALESCE(SUM(CASE WHEN tipo = 'RECEITA' THEN valor ELSE 0 END), 0) AS receitas,
                                       COALESCE(SUM(CASE WHEN tipo = 'DESPESA' THEN valor ELSE 0 END), 0) AS despesas
                                     FROM lancamentos_financeiros;";

        decimal totalReceitas = 0m;
        decimal totalDespesas = 0m;

        await using (var cmd = new MySqlCommand(sqlFinanceiro, conn))
        await using (var reader = await cmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                totalReceitas = reader.GetDecimal("receitas");
                totalDespesas = reader.GetDecimal("despesas");
            }
        }

        return new DashboardResumoDto(
            totalProdutos,
            estoqueBaixo,
            totalQuantidade,
            valorEstoque,
            totalReceitas,
            totalDespesas,
            totalReceitas - totalDespesas
        );
    }

    public async Task<IEnumerable<ProdutoEstoqueBaixoDto>> ObterProdutosEstoqueBaixoAsync()
    {
        var lista = new List<ProdutoEstoqueBaixoDto>();
        await using var conn = GetConnection();
        await conn.OpenAsync();

        const string sql = @"SELECT id, sku, nome, quantidade_estoque, estoque_minimo
                            FROM produtos
                            WHERE ativo = 1 AND quantidade_estoque <= estoque_minimo
                            ORDER BY quantidade_estoque ASC, nome ASC;";

        await using var cmd = new MySqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            lista.Add(new ProdutoEstoqueBaixoDto(
                reader.GetUInt32("id"),
                reader.GetString("sku"),
                reader.GetString("nome"),
                reader.GetInt32("quantidade_estoque"),
                reader.GetInt32("estoque_minimo")
            ));
        }

        return lista;
    }
}