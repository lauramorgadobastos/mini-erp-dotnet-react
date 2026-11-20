var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<StockFlow.Api.Repositories.ProdutoRepository>();
builder.Services.AddScoped<StockFlow.Api.Repositories.MovimentacaoRepository>();
builder.Services.AddScoped<StockFlow.Api.Services.EstoqueRuleService>();

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("FrontendPolicy");

app.UseAuthorization();

app.MapControllers();

app.Run();