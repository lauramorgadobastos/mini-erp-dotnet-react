using MySqlConnector;
using StockFlow.Api.DTOs;
using StockFlow.Api.Models;

namespace StockFlow.Api.Repositories;

public class MovimentacaoRepository
{
    private readonly IConfiguration _configuration;

    public MovimentacaoRepository(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    private MySqlConnection GetConnection()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' não configurada.");

        return new MySqlConnection(connectionString);
    }

    public async Task<IEnumerable<MovimentacaoEstoque>> ObterTodasAsync()
    {
        var lista = new List<MovimentacaoEstoque>();
        await using var conn = GetConnection();
        await conn.OpenAsync();

        const string sql = @"SELECT id, produto_id, tipo, quantidade, valor_unitario, valor_total, observacao, criado_em
                            FROM movimentacoes_estoque
                            ORDER BY criado_em DESC, id DESC;";

        await using var cmd = new MySqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            lista.Add(new MovimentacaoEstoque
            {
                Id = reader.GetUInt32("id"),
                ProdutoId = reader.GetUInt32("produto_id"),
                Tipo = reader.GetString("tipo"),
                Quantidade = reader.GetInt32("quantidade"),
                ValorUnitario = reader.GetDecimal("valor_unitario"),
                ValorTotal = reader.GetDecimal("valor_total"),
                Observacao = reader.IsDBNull(reader.GetOrdinal("observacao")) ? null : reader.GetString("observacao"),
                CriadoEm = reader.GetDateTime("criado_em")
            });
        }

        return lista;
    }

    public async Task<(bool Sucesso, string? Erro, int? StatusCode, MovimentacaoEstoque? Movimentacao)> RegistrarAsync(CriarMovimentacaoDto dto)
    {
        var tipoNormalizado = dto.Tipo.Trim().ToUpperInvariant();

        await using var conn = GetConnection();
        await conn.OpenAsync();
        await using var transaction = await conn.BeginTransactionAsync();

        try
        {
            // 1. Busca e bloqueia a linha do produto dentro da transação
            const string selectProdutoSql = @"SELECT nome, preco_unitario, custo_unitario, quantidade_estoque, ativo
                                              FROM produtos
                                              WHERE id = @Id
                                              FOR UPDATE;";

            string nomeProduto;
            decimal precoUnitario;
            decimal custoUnitario;
            int estoqueAtual;
            bool ativo;

            await using (var cmdProduto = new MySqlCommand(selectProdutoSql, conn, transaction))
            {
                cmdProduto.Parameters.AddWithValue("@Id", dto.ProdutoId);
                await using var reader = await cmdProduto.ExecuteReaderAsync();

                if (!await reader.ReadAsync())
                {
                    await transaction.RollbackAsync();
                    return (false, $"Produto com ID {dto.ProdutoId} não encontrado.", StatusCodes.Status404NotFound, null);
                }

                nomeProduto = reader.GetString("nome");
                precoUnitario = reader.GetDecimal("preco_unitario");
                custoUnitario = reader.GetDecimal("custo_unitario");
                estoqueAtual = reader.GetInt32("quantidade_estoque");
                ativo = reader.GetBoolean("ativo");
            }

            if (!ativo)
            {
                await transaction.RollbackAsync();
                return (false, "Não é possível movimentar um produto inativo.", StatusCodes.Status400BadRequest, null);
            }

            int novoEstoque = tipoNormalizado == "ENTRADA"
                ? estoqueAtual + dto.Quantidade
                : estoqueAtual - dto.Quantidade;

            if (novoEstoque < 0)
            {
                await transaction.RollbackAsync();
                return (false, $"Saldo insuficiente em estoque. Disponível: {estoqueAtual}, solicitado: {dto.Quantidade}.", StatusCodes.Status409Conflict, null);
            }

            decimal valorUnitario = dto.ValorUnitario ?? (tipoNormalizado == "ENTRADA" ? custoUnitario : precoUnitario);
            decimal valorTotal = Math.Round(valorUnitario * dto.Quantidade, 2, MidpointRounding.AwayFromZero);
            string? observacaoLimpa = string.IsNullOrWhiteSpace(dto.Observacao) ? null : dto.Observacao.Trim();

            // 2. Atualiza o saldo do produto
            const string updateEstoqueSql = @"UPDATE produtos
                                              SET quantidade_estoque = @NovoEstoque
                                              WHERE id = @Id;";

            await using (var cmdUpdate = new MySqlCommand(updateEstoqueSql, conn, transaction))
            {
                cmdUpdate.Parameters.AddWithValue("@NovoEstoque", novoEstoque);
                cmdUpdate.Parameters.AddWithValue("@Id", dto.ProdutoId);
                await cmdUpdate.ExecuteNonQueryAsync();
            }

            // 3. Insere a movimentação de estoque
            const string insertMovSql = @"INSERT INTO movimentacoes_estoque
                                              (produto_id, tipo, quantidade, valor_unitario, valor_total, observacao)
                                          VALUES
                                              (@ProdutoId, @Tipo, @Quantidade, @ValorUnitario, @ValorTotal, @Observacao);
                                          SELECT LAST_INSERT_ID();";

            uint movId;
            await using (var cmdMov = new MySqlCommand(insertMovSql, conn, transaction))
            {
                cmdMov.Parameters.AddWithValue("@ProdutoId", dto.ProdutoId);
                cmdMov.Parameters.AddWithValue("@Tipo", tipoNormalizado);
                cmdMov.Parameters.AddWithValue("@Quantidade", dto.Quantidade);
                cmdMov.Parameters.AddWithValue("@ValorUnitario", valorUnitario);
                cmdMov.Parameters.AddWithValue("@ValorTotal", valorTotal);
                cmdMov.Parameters.AddWithValue("@Observacao", (object?)observacaoLimpa ?? DBNull.Value);

                movId = Convert.ToUInt32(await cmdMov.ExecuteScalarAsync());
            }

            // 4. Gera o lançamento financeiro correspondente
            string tipoFinanceiro = tipoNormalizado == "ENTRADA" ? "DESPESA" : "RECEITA";
            string descricaoFinanceira = observacaoLimpa
                ?? $"{(tipoNormalizado == "ENTRADA" ? "Compra / Entrada" : "Venda / Saída")} - {nomeProduto} ({dto.Quantidade}x)";

            const string insertFinSql = @"INSERT INTO lancamentos_financeiros
                                              (tipo, origem, movimentacao_id, descricao, valor)
                                          VALUES
                                              (@Tipo, 'ESTOQUE', @MovimentacaoId, @Descricao, @Valor);";

            await using (var cmdFin = new MySqlCommand(insertFinSql, conn, transaction))
            {
                cmdFin.Parameters.AddWithValue("@Tipo", tipoFinanceiro);
                cmdFin.Parameters.AddWithValue("@MovimentacaoId", movId);
                cmdFin.Parameters.AddWithValue("@Descricao", descricaoFinanceira);
                cmdFin.Parameters.AddWithValue("@Valor", valorTotal);
                await cmdFin.ExecuteNonQueryAsync();
            }

            await transaction.CommitAsync();

            var movimentacaoCriada = new MovimentacaoEstoque
            {
                Id = movId,
                ProdutoId = dto.ProdutoId,
                Tipo = tipoNormalizado,
                Quantidade = dto.Quantidade,
                ValorUnitario = valorUnitario,
                ValorTotal = valorTotal,
                Observacao = observacaoLimpa,
                CriadoEm = DateTime.UtcNow
            };

            return (true, null, StatusCodes.Status201Created, movimentacaoCriada);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return (false, $"Erro ao registrar movimentação: {ex.Message}", StatusCodes.Status500InternalServerError, null);
        }
    }
}