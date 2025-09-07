using L4H.UploadGateway.Models;
using L4H.UploadGateway.Services;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

// Configure services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure upload options
builder.Services.Configure<UploadOptions>(builder.Configuration.GetSection("Uploads"));

// Configure request size limits
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 26 * 1024 * 1024; // Slightly above 25MB for headers
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 26 * 1024 * 1024; // 26MB
});

// Register services
builder.Services.AddScoped<UploadTokenService>();

// Add logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Health endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// Upload endpoint
app.MapPut("/gateway/uploads/{token}", async (
    string token, 
    HttpRequest request,
    UploadTokenService tokenService,
    IOptions<UploadOptions> uploadOptionsAccessor,
    ILogger<Program> logger) =>
{
    try
    {
        // Validate token
        if (!tokenService.ValidateToken(token, out var payload) || payload == null)
        {
            logger.LogWarning("Invalid or expired token: {Token}", token);
            return Results.BadRequest(new { error = "Invalid or expired token" });
        }

        logger.LogInformation("Processing upload for case {CaseId}, file {Filename}", 
            payload.CaseId, payload.Filename);

        // Get configuration
        var uploadOptions = uploadOptionsAccessor.Value;
        if (uploadOptions == null)
        {
            logger.LogError("Upload configuration not found");
            return Results.Problem("Server configuration error");
        }

        // Validate content length
        var contentLength = request.ContentLength ?? 0;
        if (contentLength > payload.SizeBytes)
        {
            logger.LogWarning("Content length {ContentLength} exceeds token limit {TokenLimit}", 
                contentLength, payload.SizeBytes);
            return Results.BadRequest(new { error = "File size exceeds token limit" });
        }

        var maxBytes = uploadOptions.MaxSizeMB * 1024 * 1024;
        if (contentLength > maxBytes)
        {
            logger.LogWarning("Content length {ContentLength} exceeds server limit {ServerLimit}", 
                contentLength, maxBytes);
            return Results.BadRequest(new { error = $"File size exceeds {uploadOptions.MaxSizeMB}MB limit" });
        }

        // Validate content type
        var contentType = request.ContentType ?? "";
        if (contentType != payload.ContentType)
        {
            logger.LogWarning("Content type mismatch: expected {Expected}, got {Actual}", 
                payload.ContentType, contentType);
            return Results.BadRequest(new { error = "Content type mismatch" });
        }

        // Create safe filename and directory structure
        var safeFilename = UploadTokenService.GetSafeFilename(payload.Filename);
        var safeToken = UploadTokenService.GetSafeFilename(token); // Make token safe for directory name
        var quarantineDir = Path.Combine(uploadOptions.BasePath, uploadOptions.QuarantineSubdir, safeToken);
        var filePath = Path.Combine(quarantineDir, safeFilename);

        // Ensure directory exists
        Directory.CreateDirectory(quarantineDir);

        // Stream file to disk
        using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write);
        
        var buffer = new byte[8192];
        var totalBytes = 0L;
        int bytesRead;

        while ((bytesRead = await request.Body.ReadAsync(buffer, 0, buffer.Length).ConfigureAwait(false)) > 0)
        {
            totalBytes += bytesRead;
            
            // Safety check during streaming
            if (totalBytes > maxBytes)
            {
                fileStream.Close();
                File.Delete(filePath);
                logger.LogWarning("File stream exceeded size limit during upload");
                return Results.BadRequest(new { error = "File size limit exceeded during upload" });
            }

            await fileStream.WriteAsync(buffer, 0, bytesRead).ConfigureAwait(false);
        }

        logger.LogInformation("Upload completed: {FilePath}, {TotalBytes} bytes", 
            filePath, totalBytes);

        var key = $"{token}/{safeFilename}";
        return Results.Created($"/gateway/uploads/{token}", new 
        { 
            status = "stored", 
            key = key,
            sizeBytes = totalBytes
        });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error processing upload for token {Token}", token);
        return Results.Problem("Internal server error during upload");
    }
});

app.Run();

public partial class Program { } // For testing