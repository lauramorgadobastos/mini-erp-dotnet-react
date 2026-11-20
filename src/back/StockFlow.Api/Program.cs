using System.Globalization;

var builder = WebApplication.CreateBuilder(args);

// Carrega src/back/.env 
var currentDir = Directory.GetCurrentDirectory();
var envPath = Path.GetFullPath(Path.Combine(currentDir, "..", ".env"));
if (!File.Exists(envPath))
{
    envPath = Path.GetFullPath(Path.Combine(currentDir, ".env"));
}

if (File.Exists(envPath))
{
    foreach (var rawLine in File.ReadAllLines(envPath))
    {
        var line = rawLine.Trim();
        if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
            continue;

        var separatorIndex = line.IndexOf('=');
        if (separatorIndex <= 0)
            continue;

        var key = line[..separatorIndex].Trim();
        var value = line[(separatorIndex + 1)..].Trim().Trim('"').Trim('\'');

        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
        {
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}

string GetEnvOrConfig(string key, string fallback = "") =>
    Environment.GetEnvironmentVariable(key)
    ?? builder.Configuration[key]
    ?? fallback;

var dbHost = GetEnvOrConfig("DB_HOST", "localhost");
var dbPort = GetEnvOrConfig("DB_PORT", "3306");
var dbName = GetEnvOrConfig("DB_NAME", "stockflow_db");
var dbUser = GetEnvOrConfig("DB_USER", "root");
var dbPassword = GetEnvOrConfig("DB_PASSWORD", "");
var port = GetEnvOrConfig("PORT", "5000");

// Monta a ConnectionString padrão a partir das variáveis do .env
var defaultConnectionString =
    $"Server={dbHost};Port={dbPort};Database={dbName};Uid={dbUser};Pwd={dbPassword};";

builder.Configuration["ConnectionStrings:DefaultConnection"] = defaultConnectionString;

// Configura a porta via PORT do .env caso ASPNETCORE_URLS não tenha sido informado explicitamente
if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ASPNETCORE_URLS")) &&
    int.TryParse(port, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsedPort) &&
    parsedPort > 0)
{
    builder.WebHost.UseUrls($"http://localhost:{parsedPort}");
}

builder.Services.AddScoped<StockFlow.Api.Repositories.ProdutoRepository>();
builder.Services.AddScoped<StockFlow.Api.Repositories.MovimentacaoRepository>();
builder.Services.AddScoped<StockFlow.Api.Services.EstoqueRuleService>();
builder.Services.AddScoped<StockFlow.Api.Repositories.FinanceiroRepository>();

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