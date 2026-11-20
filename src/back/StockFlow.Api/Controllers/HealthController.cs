using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace StockFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public HealthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<IActionResult> GetAsync()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                status = "unhealthy",
                database = "not_configured",
                timestamp = DateTime.UtcNow
            });
        }

        try
        {
            await using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();
            await using var command = new MySqlCommand("SELECT 1;", connection);
            await command.ExecuteScalarAsync();

            return Ok(new
            {
                status = "healthy",
                database = "connected",
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "degraded",
                database = "unreachable",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }
}