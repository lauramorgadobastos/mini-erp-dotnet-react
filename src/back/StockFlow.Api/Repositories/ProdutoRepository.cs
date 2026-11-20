using MySqlConnector;
using StockFlow.Api.Models;

namespace StockFlow.Api.Repositories;

public class ProdutoRepository
{
    private readonly IConfiguration _configuration;

    public ProdutoRepository(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    private MySqlConnection GetConnection()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' não configurada.");

        return new MySqlConnection(connectionString);
    }

    public async Task<IEnumerable<Produto>> ObterTodosAsync(bool incluirInativos = true)
    {
        var produtos = new List<Produto>();
        await using var conn = GetConnection();
        await conn.OpenAsync();

        var sql = incluirInativos
            ? @"SELECT id, sku, nome, descricao, preco_unitario, custo_unitario,
                       quantidade_estoque, estoque_minimo, ativo, criado_em, atualizado_em
                FROM produtos
                ORDER BY nome ASC;"
            : @"SELECT id, sku, nome, descricao, preco_unitario, custo_unitario,
                       quantidade_estoque, estoque_minimo, ativo, criado_em, atualizado_em
                FROM produtos
                WHERE ativo = 1
                ORDER BY nome ASC;";

        await using var cmd = new MySqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            produtos.Add(MapReaderToProduto(reader));
        }

        return produtos;
    }

    public async Task<Produto?> ObterPorIdAsync(uint id)
    {
        await using var conn = GetConnection();
        await conn.OpenAsync();

        const string sql = @"SELECT id, sku, nome, descricao, preco_unitario, custo_unitario,
                                   quantidade_estoque, estoque_minimo, ativo, criado_em, atualizado_em
                            FROM produtos
                            WHERE id = @Id;";

        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapReaderToProduto(reader) : null;
    }

    public async Task<Produto?> ObterPorSkuAsync(string sku)
    {
        await using var conn = GetConnection();
        await conn.OpenAsync();

        const string sql = @"SELECT id, sku, nome, descricao, preco_unitario, custo_unitario,
                                   quantidade_estoque, estoque_minimo, ativo, criado_em, atualizado_em
                            FROM produtos
                            WHERE sku = @Sku;";

        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Sku", sku.Trim().ToUpperInvariant());

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapReaderToProduto(reader) : null;
    }

    public async Task<uint> CriarAsync(Produto produto)
    {
        await using var conn = GetConnection();
        await conn.OpenAsync();

        const string sql = @"INSERT INTO produtos
                                (sku, nome, descricao, preco_unitario, custo_unitario, quantidade_estoque, estoque_minimo, ativo)
                            VALUES
                                (@Sku, @Nome, @Descricao, @PrecoUnitario, @CustoUnitario, @QuantidadeEstoque, @EstoqueMinimo, @Ativo);
                            SELECT LAST_INSERT_ID();";

        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Sku", produto.Sku.Trim().ToUpperInvariant());
        cmd.Parameters.AddWithValue("@Nome", produto.Nome.Trim());
        cmd.Parameters.AddWithValue("@Descricao", string.IsNullOrWhiteSpace(produto.Descricao) ? DBNull.Value : produto.Descricao.Trim());
        cmd.Parameters.AddWithValue("@PrecoUnitario", produto.PrecoUnitario);
        cmd.Parameters.AddWithValue("@CustoUnitario", produto.CustoUnitario);
        cmd.Parameters.AddWithValue("@QuantidadeEstoque", produto.QuantidadeEstoque);
        cmd.Parameters.AddWithValue("@EstoqueMinimo", produto.EstoqueMinimo);
        cmd.Parameters.AddWithValue("@Ativo", produto.Ativo);

        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToUInt32(result);
    }

    public async Task<bool> AtualizarAsync(Produto produto)
    {
        await using var conn = GetConnection();
        await conn.OpenAsync();

        const string sql = @"UPDATE produtos
                            SET nome = @Nome,
                                descricao = @Descricao,
                                preco_unitario = @PrecoUnitario,
                                custo_unitario = @CustoUnitario,
                                estoque_minimo = @EstoqueMinimo,
                                ativo = @Ativo
                            WHERE id = @Id;";

        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", produto.Id);
        cmd.Parameters.AddWithValue("@Nome", produto.Nome.Trim());
        cmd.Parameters.AddWithValue("@Descricao", string.IsNullOrWhiteSpace(produto.Descricao) ? DBNull.Value : produto.Descricao.Trim());
        cmd.Parameters.AddWithValue("@PrecoUnitario", produto.PrecoUnitario);
        cmd.Parameters.AddWithValue("@CustoUnitario", produto.CustoUnitario);
        cmd.Parameters.AddWithValue("@EstoqueMinimo", produto.EstoqueMinimo);
        cmd.Parameters.AddWithValue("@Ativo", produto.Ativo);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> AlterarStatusAtivoAsync(uint id, bool ativo)
    {
        await using var conn = GetConnection();
        await conn.OpenAsync();

        const string sql = @"UPDATE produtos
                            SET ativo = @Ativo
                            WHERE id = @Id;";

        await using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@Ativo", ativo);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    private static Produto MapReaderToProduto(MySqlDataReader reader) => new()
    {
        Id = reader.GetUInt32("id"),
        Sku = reader.GetString("sku"),
        Nome = reader.GetString("nome"),
        Descricao = reader.IsDBNull(reader.GetOrdinal("descricao")) ? null : reader.GetString("descricao"),
        PrecoUnitario = reader.GetDecimal("preco_unitario"),
        CustoUnitario = reader.GetDecimal("custo_unitario"),
        QuantidadeEstoque = reader.GetInt32("quantidade_estoque"),
        EstoqueMinimo = reader.GetInt32("estoque_minimo"),
        Ativo = reader.GetBoolean("ativo"),
        CriadoEm = reader.GetDateTime("criado_em"),
        AtualizadoEm = reader.GetDateTime("atualizado_em")
    };
}