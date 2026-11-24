using Microsoft.AspNetCore.Mvc;
using StockFlow.Api.Repositories;

namespace StockFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FinanceiroController : ControllerBase
{
    private readonly FinanceiroRepository _repository;

    public FinanceiroController(FinanceiroRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> ObterLancamentos([FromQuery] string? tipo)
    {
        if (!string.IsNullOrWhiteSpace(tipo))
        {
            var tipoNormalizado = tipo.Trim().ToUpperInvariant();
            if (tipoNormalizado is not ("RECEITA" or "DESPESA"))
                return BadRequest(new { mensagem = "O filtro 'tipo' deve ser RECEITA ou DESPESA." });
        }

        var lancamentos = await _repository.ObterTodosAsync(tipo);
        return Ok(lancamentos);
    }

    [HttpPost]
    public async Task<IActionResult> CriarLancamento([FromBody] CriarLancamentoFinanceiroRequest? request)
    {
        if (request is null)
            return BadRequest(new { mensagem = "Dados do lançamento não informados." });

        var tipoNormalizado = request.Tipo?.Trim().ToUpperInvariant();
        if (tipoNormalizado is not ("RECEITA" or "DESPESA"))
            return BadRequest(new { mensagem = "O tipo do lançamento deve ser RECEITA ou DESPESA." });

        if (string.IsNullOrWhiteSpace(request.Descricao))
            return BadRequest(new { mensagem = "A descrição do lançamento é obrigatória." });

        if (request.Valor <= 0)
            return BadRequest(new { mensagem = "O valor do lançamento deve ser maior que zero." });

        var criado = await _repository.CriarAsync(request);
        return Created($"/api/financeiro/{criado.Id}", criado);
    }
}