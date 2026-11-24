using MySqlConnector;
using StockFlow.Api.DTOs;
using StockFlow.Api.Models;

namespace StockFlow.Api.Repositories;

public record CriarLancamentoFinanceiroRequest(
    string Tipo,
    string Descricao,
    string? Categoria,
    decimal Valor,
    DateOnly? DataVencimento,
    string? Observacao,
    string? Origem
);

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
        var origemOrdinal = reader.GetOrdinal("origem");
        var movimentacaoIdOrdinal = reader.GetOrdinal("movimentacao_id");

        while (await reader.ReadAsync())
        {
            var origem = reader.IsDBNull(origemOrdinal)
                ? "MANUAL"
                : reader.GetString(origemOrdinal);

            var movimentacaoId = reader.IsDBNull(movimentacaoIdOrdinal)
                ? (uint?)null
                : reader.GetUInt32(movimentacaoIdOrdinal);

            lista.Add(new LancamentoFinanceiro
            {
                Id = reader.GetUInt32("id"),
                Tipo = reader.GetString("tipo"),
                Origem = origem,
                MovimentacaoId = movimentacaoId,
                Descricao = reader.GetString("descricao"),
                Valor = reader.GetDecimal("valor"),
                CriadoEm = reader.GetDateTime("criado_em")
            });
        }

        return lista;
    }

    public async Task<LancamentoFinanceiro> CriarAsync(CriarLancamentoFinanceiroRequest request)
    {
        await using var conn = GetConnection();
        await conn.OpenAsync();

        var tipoNormalizado = request.Tipo.Trim().ToUpperInvariant();
        var categoriaNormalizada = string.IsNullOrWhiteSpace(request.Categoria)
            ? "Geral"
            : request.Categoria.Trim();
        var descricaoNormalizada = request.Descricao.Trim();
        var origemNormalizada = string.IsNullOrWhiteSpace(request.Origem)
            ? "MANUAL"
            : request.Origem.Trim().ToUpperInvariant();
        var observacaoNormalizada = string.IsNullOrWhiteSpace(request.Observacao)
            ? null
            : request.Observacao.Trim();
        var dataVencimento = request.DataVencimento ?? DateOnly.FromDateTime(DateTime.Today);

        const string sqlInsert = @"
            INSERT INTO lancamentos_financeiros
                (descricao, categoria, tipo, status, valor, data_vencimento, data_pagamento, observacao, origem, movimentacao_id)
            VALUES
                (@Descricao, @Categoria, @Tipo, @Status, @Valor, @DataVencimento, @DataPagamento, @Observacao, @Origem, @MovimentacaoId);
            SELECT LAST_INSERT_ID();";

        await using var cmd = new MySqlCommand(sqlInsert, conn);
        cmd.Parameters.AddWithValue("@Descricao", descricaoNormalizada);
        cmd.Parameters.AddWithValue("@Categoria", categoriaNormalizada);
        cmd.Parameters.AddWithValue("@Tipo", tipoNormalizado);
        cmd.Parameters.AddWithValue("@Status", "PAGO");
        cmd.Parameters.AddWithValue("@Valor", request.Valor);
        cmd.Parameters.AddWithValue("@DataVencimento", dataVencimento.ToDateTime(TimeOnly.MinValue));
        cmd.Parameters.AddWithValue("@DataPagamento", DateTime.Today);
        cmd.Parameters.AddWithValue("@Observacao", (object?)observacaoNormalizada ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Origem", origemNormalizada);
        cmd.Parameters.AddWithValue("@MovimentacaoId", DBNull.Value);

        var idObj = await cmd.ExecuteScalarAsync();
        var novoId = Convert.ToUInt32(idObj);

        const string sqlSelect = @"
            SELECT id, tipo, origem, movimentacao_id, descricao, valor, criado_em
            FROM lancamentos_financeiros
            WHERE id = @Id;";

        await using var selectCmd = new MySqlCommand(sqlSelect, conn);
        selectCmd.Parameters.AddWithValue("@Id", novoId);

        await using var reader = await selectCmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            var origemOrdinal = reader.GetOrdinal("origem");
            var movimentacaoIdOrdinal = reader.GetOrdinal("movimentacao_id");

            return new LancamentoFinanceiro
            {
                Id = reader.GetUInt32("id"),
                Tipo = reader.GetString("tipo"),
                Origem = reader.IsDBNull(origemOrdinal) ? "MANUAL" : reader.GetString(origemOrdinal),
                MovimentacaoId = reader.IsDBNull(movimentacaoIdOrdinal)
                    ? null
                    : reader.GetUInt32(movimentacaoIdOrdinal),
                Descricao = reader.GetString("descricao"),
                Valor = reader.GetDecimal("valor"),
                CriadoEm = reader.GetDateTime("criado_em")
            };
        }

        return new LancamentoFinanceiro
        {
            Id = novoId,
            Tipo = tipoNormalizado,
            Origem = origemNormalizada,
            MovimentacaoId = null,
            Descricao = descricaoNormalizada,
            Valor = request.Valor,
            CriadoEm = DateTime.Now
        };
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