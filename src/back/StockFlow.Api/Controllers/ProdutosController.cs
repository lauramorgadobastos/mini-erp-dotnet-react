using Microsoft.AspNetCore.Mvc;
using StockFlow.Api.DTOs;
using StockFlow.Api.Models;
using StockFlow.Api.Repositories;

namespace StockFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProdutosController : ControllerBase
{
    private readonly ProdutoRepository _repository;

    public ProdutosController(ProdutoRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> ObterTodos([FromQuery] bool incluirInativos = true)
    {
        var produtos = await _repository.ObterTodosAsync(incluirInativos);
        return Ok(produtos);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObterPorId(uint id)
    {
        if (id == 0)
            return BadRequest(new { mensagem = "O ID do produto deve ser maior que zero." });

        var produto = await _repository.ObterPorIdAsync(id);
        if (produto is null)
            return NotFound(new { mensagem = $"Produto com ID {id} não encontrado." });

        return Ok(produto);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CriarProdutoDto dto)
    {
        var skuNormalizado = dto.Sku.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(skuNormalizado))
            return BadRequest(new { mensagem = "O SKU não pode ser vazio." });

        var existente = await _repository.ObterPorSkuAsync(skuNormalizado);
        if (existente is not null)
            return Conflict(new { mensagem = $"Já existe um produto cadastrado com o SKU '{skuNormalizado}'." });

        var produto = new Produto
        {
            Sku = skuNormalizado,
            Nome = dto.Nome.Trim(),
            Descricao = string.IsNullOrWhiteSpace(dto.Descricao) ? null : dto.Descricao.Trim(),
            PrecoUnitario = dto.PrecoUnitario,
            CustoUnitario = dto.CustoUnitario,
            QuantidadeEstoque = dto.QuantidadeEstoque,
            EstoqueMinimo = dto.EstoqueMinimo,
            Ativo = true
        };

        var idCriado = await _repository.CriarAsync(produto);
        var produtoCriado = await _repository.ObterPorIdAsync(idCriado);

        return CreatedAtAction(nameof(ObterPorId), new { id = idCriado }, produtoCriado);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Atualizar(uint id, [FromBody] AtualizarProdutoDto dto)
    {
        if (id == 0)
            return BadRequest(new { mensagem = "O ID do produto deve ser maior que zero." });

        var produto = await _repository.ObterPorIdAsync(id);
        if (produto is null)
            return NotFound(new { mensagem = $"Produto com ID {id} não encontrado." });

        produto.Nome = dto.Nome.Trim();
        produto.Descricao = string.IsNullOrWhiteSpace(dto.Descricao) ? null : dto.Descricao.Trim();
        produto.PrecoUnitario = dto.PrecoUnitario;
        produto.CustoUnitario = dto.CustoUnitario;
        produto.EstoqueMinimo = dto.EstoqueMinimo;
        produto.Ativo = dto.Ativo;

        await _repository.AtualizarAsync(produto);
        var atualizado = await _repository.ObterPorIdAsync(id);

        return Ok(atualizado);
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> AlterarStatus(uint id, [FromQuery] bool ativo)
    {
        if (id == 0)
            return BadRequest(new { mensagem = "O ID do produto deve ser maior que zero." });

        var produto = await _repository.ObterPorIdAsync(id);
        if (produto is null)
            return NotFound(new { mensagem = $"Produto com ID {id} não encontrado." });

        await _repository.AlterarStatusAtivoAsync(id, ativo);
        var atualizado = await _repository.ObterPorIdAsync(id);

        return Ok(atualizado);
    }
}