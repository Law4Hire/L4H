namespace L4H.UploadGateway.Models;

public class UploadOptions
{
    public string BasePath { get; set; } = "/data/uploads";
    public string QuarantineSubdir { get; set; } = "quarantine";
    public int MaxSizeMB { get; set; } = 25;
    public List<string> AllowedExtensions { get; set; } = new List<string>();
    public TokenOptions Token { get; set; } = new TokenOptions();
}

public class TokenOptions
{
    public string SigningKey { get; set; } = "CHANGE_ME_DEV_ONLY";
    public int TtlMinutes { get; set; } = 30;
}