using Microsoft.AspNetCore.Mvc;
using StockFlow.Api.Repositories;

namespace StockFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly FinanceiroRepository _repository;

    public DashboardController(FinanceiroRepository repository)
    {
        _repository = repository;
    }

    [HttpGet("resumo")]
    public async Task<IActionResult> ObterResumo()
    {
        var resumo = await _repository.ObterResumoDashboardAsync();
        return Ok(resumo);
    }

    [HttpGet("alertas-estoque")]
    public async Task<IActionResult> ObterAlertasEstoque()
    {
        var alertas = await _repository.ObterProdutosEstoqueBaixoAsync();
        return Ok(alertas);
    }
}