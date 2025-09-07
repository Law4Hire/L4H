# API Localization

## Overview

The L4H API provides comprehensive internationalization (i18n) support with 21 cultures, allowing clients to receive localized responses and manage user language preferences.

## Supported Cultures

The API supports the following 21 cultures:

| Code | Display Name | Region |
|------|--------------|--------|
| ar-SA | Arabic (Saudi Arabia) | Middle East |
| bn-BD | Bengali (Bangladesh) | South Asia |
| de-DE | German (Germany) | Europe |
| en-US | English (United States) | North America |
| es-ES | Spanish (Spain) | Europe |
| fr-FR | French (France) | Europe |
| hi-IN | Hindi (India) | South Asia |
| id-ID | Indonesian (Indonesia) | Southeast Asia |
| it-IT | Italian (Italy) | Europe |
| ja-JP | Japanese (Japan) | East Asia |
| ko-KR | Korean (Korea) | East Asia |
| mr-IN | Marathi (India) | South Asia |
| pl-PL | Polish (Poland) | Europe |
| pt-PT | Portuguese (Portugal) | Europe |
| ru-RU | Russian (Russia) | Europe/Asia |
| ta-IN | Tamil (India) | South Asia |
| te-IN | Telugu (India) | South Asia |
| tr-TR | Turkish (Türkiye) | Europe/Asia |
| ur-PK | Urdu (Pakistan) | South Asia |
| vi-VN | Vietnamese (Vietnam) | Southeast Asia |
| zh-CN | Chinese (Simplified, China) | East Asia |

## Culture Resolution Precedence

The API determines the user's preferred culture using the following precedence order (highest to lowest):

1. **Cookie** - `l4h_culture` cookie set via the culture endpoint
2. **Accept-Language Header** - Standard HTTP header sent by browsers
3. **Query Parameter** - `?ui-culture=xx-YY` in the URL
4. **Default** - Falls back to `en-US` (English - United States)

### Cookie Details
- **Name**: `l4h_culture`
- **Properties**: HttpOnly, SameSite=Lax
- **Expiration**: 90 days
- **Example**: `l4h_culture=es-ES`

## API Endpoints

### Get Supported Cultures

Returns the complete list of supported cultures with their display names.

```http
GET /v1/i18n/supported
```

**Response:**
```json
[
  {
    "code": "ar-SA",
    "displayName": "Arabic (Saudi Arabia)"
  },
  {
    "code": "en-US", 
    "displayName": "English (United States)"
  }
  // ... 19 more cultures
]
```

### Set Culture Preference

Sets the user's culture preference via a secure cookie.

```http
POST /v1/i18n/culture
Content-Type: application/json

{
  "culture": "es-ES"
}
```

**Success Response:**
- **Status**: `204 No Content`
- **Headers**: Sets `l4h_culture` cookie

**Error Responses:**
- **400 Bad Request**: Invalid or unsupported culture code

## Resource Files

### Structure
```
src/api/Resources/
├── Shared.resx              # Default (en-US)
├── Shared.es-ES.resx        # Spanish
├── Shared.fr-FR.resx        # French
└── ... (19 more culture files)
```

### Resource Keys

The following resource keys are currently implemented:

| Key | en-US | es-ES |
|-----|-------|-------|
| `Errors.PasswordPolicy` | "Password must be at least 8 chars and meet complexity." | *(falls back to en-US)* |
| `Auth.LoginFailed` | "Invalid email or password." | "Correo o contraseña inválidos." |
| `Auth.EmailSent` | "We've sent you an email with a link to continue." | *(falls back to en-US)* |

### Adding New Translations

1. Add the key-value pair to `Shared.resx` (English default)
2. Add translations to relevant `Shared.{culture}.resx` files
3. Use `IStringLocalizer<Shared>` in controllers:
   ```csharp
   var message = _localizer["Your.Resource.Key"];
   ```

## Usage Examples

### Setting Spanish Culture
```bash
# Set culture preference
curl -X POST "http://localhost:8765/v1/i18n/culture" \
  -H "Content-Type: application/json" \
  -d '{"culture":"es-ES"}'

# Subsequent requests will use Spanish localization
curl "http://localhost:8765/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"wrong"}' \
  --cookie-jar cookies.txt
  
# Response will contain: "Correo o contraseña inválidos."
```

### Using Accept-Language Header
```bash
curl "http://localhost:8765/v1/auth/login" \
  -H "Accept-Language: es-ES,es;q=0.9,en;q=0.8" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"wrong"}'
```

### Using Query Parameter
```bash
curl "http://localhost:8765/v1/auth/login?ui-culture=es-ES" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"wrong"}'
```

## Implementation Details

### Services Registration
```csharp
// Program.cs
builder.Services.AddLocalization();

var locOpts = new RequestLocalizationOptions()
    .SetDefaultCulture("en-US")
    .AddSupportedCultures(supportedCultures)
    .AddSupportedUICultures(supportedCultures);

locOpts.RequestCultureProviders.Insert(0, new CookieRequestCultureProvider {
    CookieName = "l4h_culture"
});
```

### Middleware Order
```csharp
app.UseSerilogRequestLogging();
app.UseRequestLocalization(locOpts);  // Before authentication
app.UseAuthentication();
app.UseAuthorization();
```

### Controller Usage
```csharp
[ApiController]
public class MyController : ControllerBase
{
    private readonly IStringLocalizer<Shared> _localizer;
    
    public MyController(IStringLocalizer<Shared> localizer)
    {
        _localizer = localizer;
    }
    
    public IActionResult GetMessage()
    {
        return Ok(new { message = _localizer["My.Resource.Key"] });
    }
}
```

## Testing

The localization system includes comprehensive integration tests:

1. **Culture Endpoints**: Verify supported cultures and culture setting
2. **Resource Resolution**: Test fallback behavior and culture-specific translations  
3. **Cookie Handling**: Ensure proper cookie setting and reading
4. **Integration**: End-to-end localization with auth endpoints

Run tests:
```bash
dotnet test tests/api.tests/ --filter "Localization"
```

## Future Enhancements

- **Pluralization**: Support for plural forms in different languages
- **Date/Number Formatting**: Culture-specific formatting for dates and numbers
- **RTL Support**: Right-to-left text direction for Arabic and other RTL languages
- **Translation Management**: Web interface for managing translations
- **Automated Translation**: Integration with translation services for initial translations

---

*Last Updated: 2025-09-01*