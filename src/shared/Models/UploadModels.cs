namespace L4H.Shared.Models;

/// <summary>
/// Configuration options for file upload system
/// </summary>
public class UploadOptions
{
    /// <summary>
    /// Base path for storing uploaded files
    /// </summary>
    public string BasePath { get; set; } = "/data/uploads";

    /// <summary>
    /// Subdirectory for quarantined files (pending virus scan)
    /// </summary>
    public string QuarantineSubdir { get; set; } = "quarantine";

    /// <summary>
    /// Subdirectory for clean files (passed virus scan)
    /// </summary>
    public string CleanSubdir { get; set; } = "clean";

    /// <summary>
    /// Maximum file size in megabytes
    /// </summary>
    public int MaxSizeMB { get; set; } = 25;

    /// <summary>
    /// List of allowed file extensions (e.g., ".pdf", ".jpg")
    /// </summary>
    public List<string> AllowedExtensions { get; set; } = new List<string>();

    /// <summary>
    /// Upload gateway configuration
    /// </summary>
    public GatewayOptions Gateway { get; set; } = new GatewayOptions();

    /// <summary>
    /// Upload token configuration
    /// </summary>
    public TokenOptions Token { get; set; } = new TokenOptions();

    /// <summary>
    /// Whether to disable antivirus scanning (for testing only)
    /// </summary>
    public bool DisableAntivirusScan { get; set; } = false;
}

/// <summary>
/// Configuration for upload gateway microservice
/// </summary>
public class GatewayOptions
{
    /// <summary>
    /// Public base URL for the upload gateway service
    /// </summary>
    public string PublicBaseUrl { get; set; } = "http://localhost:7070";
}

/// <summary>
/// Configuration for upload tokens
/// </summary>
public class TokenOptions
{
    /// <summary>
    /// HMAC signing key for upload tokens (MUST be changed in production)
    /// </summary>
    public string SigningKey { get; set; } = "CHANGE_ME_DEV_ONLY";

    /// <summary>
    /// Time-to-live for upload tokens in minutes
    /// </summary>
    public int TtlMinutes { get; set; } = 30;
}
