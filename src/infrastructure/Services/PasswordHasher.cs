using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace L4H.Infrastructure.Services;

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string hashedPassword);
}

public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16; // 16 bytes = 128 bits
    private const int HashSize = 32; // 32 bytes = 256 bits  
    private const int Iterations = 310_000; // OWASP recommendation for 2023+
    private const string Algorithm = "PBKDF2-SHA256";

    public string HashPassword(string password)
    {
        if (string.IsNullOrEmpty(password))
            throw new ArgumentNullException(nameof(password));

        // Generate a random salt
        var salt = new byte[SaltSize];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(salt);

        // Hash the password
        var hash = HashPasswordInternal(password, salt);

        // Create the hash structure
        var hashData = new PasswordHashData
        {
            Algorithm = Algorithm,
            Iterations = Iterations,
            Salt = Convert.ToBase64String(salt),
            Hash = Convert.ToBase64String(hash)
        };

        return JsonSerializer.Serialize(hashData);
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(hashedPassword))
            return false;

        try
        {
            var hashData = JsonSerializer.Deserialize<PasswordHashData>(hashedPassword);
            if (hashData == null || hashData.Algorithm != Algorithm)
                return false;

            var salt = Convert.FromBase64String(hashData.Salt);
            var originalHash = Convert.FromBase64String(hashData.Hash);

            // Hash the provided password with the same salt and iterations
            var computedHash = HashPasswordInternal(password, salt, hashData.Iterations);

            // Compare hashes using constant-time comparison to prevent timing attacks
            return CryptographicOperations.FixedTimeEquals(originalHash, computedHash);
        }
        catch
        {
            return false;
        }
    }

    private static byte[] HashPasswordInternal(string password, byte[] salt, int iterations = Iterations)
    {
        using var pbkdf2 = new Rfc2898DeriveBytes(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations,
            HashAlgorithmName.SHA256);

        return pbkdf2.GetBytes(HashSize);
    }

    private class PasswordHashData
    {
        public string Algorithm { get; set; } = string.Empty;
        public int Iterations { get; set; }
        public string Salt { get; set; } = string.Empty;
        public string Hash { get; set; } = string.Empty;
    }
}