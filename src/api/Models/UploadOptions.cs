namespace L4H.Api.Models;

public class UploadOptions
{
    public string BasePath { get; set; } = "/data/uploads";
    public string QuarantineSubdir { get; set; } = "quarantine";
    public string CleanSubdir { get; set; } = "clean";
    public int MaxSizeMB { get; set; } = 25;
    public List<string> AllowedExtensions { get; set; } = new List<string>();
    public GatewayOptions Gateway { get; set; } = new GatewayOptions();
    public TokenOptions Token { get; set; } = new TokenOptions();
    public bool DisableAntivirusScan { get; set; } = false;
}

public class GatewayOptions
{
    public string PublicBaseUrl { get; set; } = "http://localhost:7070";
}

public class TokenOptions
{
    public string SigningKey { get; set; } = "CHANGE_ME_DEV_ONLY";
    public int TtlMinutes { get; set; } = 30;
}