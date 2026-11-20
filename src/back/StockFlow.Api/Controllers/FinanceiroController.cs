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
}