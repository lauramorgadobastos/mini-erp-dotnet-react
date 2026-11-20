using Microsoft.AspNetCore.Mvc;
using StockFlow.Api.DTOs;
using StockFlow.Api.Repositories;

namespace StockFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MovimentacoesController : ControllerBase
{
    private readonly MovimentacaoRepository _repository;

    public MovimentacoesController(MovimentacaoRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> ObterTodas()
    {
        var movimentacoes = await _repository.ObterTodasAsync();
        return Ok(movimentacoes);
    }

    [HttpPost]
    public async Task<IActionResult> Registrar([FromBody] CriarMovimentacaoDto dto)
    {
        var resultado = await _repository.RegistrarAsync(dto);

        if (!resultado.Sucesso)
        {
            return StatusCode(
                resultado.StatusCode ?? StatusCodes.Status400BadRequest,
                new { mensagem = resultado.Erro }
            );
        }

        return StatusCode(StatusCodes.Status201Created, resultado.Movimentacao);
    }
}