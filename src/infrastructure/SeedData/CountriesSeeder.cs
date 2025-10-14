using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.SeedData;

public class CountriesSeeder : ISeedTask
{
    public string Name => "Countries";

    private readonly L4HDbContext _context;
    private readonly ILogger<CountriesSeeder> _logger;

    public CountriesSeeder(L4HDbContext context, ILogger<CountriesSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        var existingCount = await _context.Countries.CountAsync().ConfigureAwait(false);

        // If we have less than 214 countries, delete and reseed all
        if (existingCount > 0 && existingCount < 214)
        {
            _logger.LogInformation("Found incomplete country data ({Count} records), clearing and reseeding all countries", existingCount);
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Countries").ConfigureAwait(false);
            existingCount = 0;
        }

        if (existingCount > 0)
        {
            _logger.LogDebug("Countries already seeded ({Count} records), skipping", existingCount);
            return;
        }

        // Use raw SQL to insert all 214 countries
        await SeedCountriesFromSQL().ConfigureAwait(false);
        _logger.LogInformation("Countries seed data loaded successfully from SQL.");
    }

    private async Task SeedCountriesFromSQL()
    {
        // All 214 countries and territories data
        var sql = @"
            INSERT INTO Countries (Iso2, Iso3, Name, IsActive) VALUES
            -- Africa (54 countries)
            ('DZ', 'DZA', 'Algeria', 1),
            ('AO', 'AGO', 'Angola', 1),
            ('BJ', 'BEN', 'Benin', 1),
            ('BW', 'BWA', 'Botswana', 1),
            ('BF', 'BFA', 'Burkina Faso', 1),
            ('BI', 'BDI', 'Burundi', 1),
            ('CM', 'CMR', 'Cameroon', 1),
            ('CV', 'CPV', 'Cape Verde', 1),
            ('CF', 'CAF', 'Central African Republic', 1),
            ('TD', 'TCD', 'Chad', 1),
            ('KM', 'COM', 'Comoros', 1),
            ('CG', 'COG', 'Congo', 1),
            ('CD', 'COD', 'Democratic Republic of the Congo', 1),
            ('CI', 'CIV', 'Côte d''Ivoire', 1),
            ('DJ', 'DJI', 'Djibouti', 1),
            ('EG', 'EGY', 'Egypt', 1),
            ('GQ', 'GNQ', 'Equatorial Guinea', 1),
            ('ER', 'ERI', 'Eritrea', 1),
            ('ET', 'ETH', 'Ethiopia', 1),
            ('GA', 'GAB', 'Gabon', 1),
            ('GM', 'GMB', 'Gambia', 1),
            ('GH', 'GHA', 'Ghana', 1),
            ('GN', 'GIN', 'Guinea', 1),
            ('GW', 'GNB', 'Guinea-Bissau', 1),
            ('KE', 'KEN', 'Kenya', 1),
            ('LS', 'LSO', 'Lesotho', 1),
            ('LR', 'LBR', 'Liberia', 1),
            ('LY', 'LBY', 'Libya', 1),
            ('MG', 'MDG', 'Madagascar', 1),
            ('MW', 'MWI', 'Malawi', 1),
            ('ML', 'MLI', 'Mali', 1),
            ('MR', 'MRT', 'Mauritania', 1),
            ('MU', 'MUS', 'Mauritius', 1),
            ('MA', 'MAR', 'Morocco', 1),
            ('MZ', 'MOZ', 'Mozambique', 1),
            ('NA', 'NAM', 'Namibia', 1),
            ('NE', 'NER', 'Niger', 1),
            ('NG', 'NGA', 'Nigeria', 1),
            ('RW', 'RWA', 'Rwanda', 1),
            ('ST', 'STP', 'São Tomé and Príncipe', 1),
            ('SN', 'SEN', 'Senegal', 1),
            ('SC', 'SYC', 'Seychelles', 1),
            ('SL', 'SLE', 'Sierra Leone', 1),
            ('SO', 'SOM', 'Somalia', 1),
            ('ZA', 'ZAF', 'South Africa', 1),
            ('SS', 'SSD', 'South Sudan', 1),
            ('SD', 'SDN', 'Sudan', 1),
            ('SZ', 'SWZ', 'Swaziland', 1),
            ('TZ', 'TZA', 'Tanzania', 1),
            ('TG', 'TGO', 'Togo', 1),
            ('TN', 'TUN', 'Tunisia', 1),
            ('UG', 'UGA', 'Uganda', 1),
            ('ZM', 'ZMB', 'Zambia', 1),
            ('ZW', 'ZWE', 'Zimbabwe', 1),

            -- Asia (48 countries)
            ('AF', 'AFG', 'Afghanistan', 1),
            ('AM', 'ARM', 'Armenia', 1),
            ('AZ', 'AZE', 'Azerbaijan', 1),
            ('BH', 'BHR', 'Bahrain', 1),
            ('BD', 'BGD', 'Bangladesh', 1),
            ('BT', 'BTN', 'Bhutan', 1),
            ('BN', 'BRN', 'Brunei', 1),
            ('KH', 'KHM', 'Cambodia', 1),
            ('CN', 'CHN', 'China', 1),
            ('CY', 'CYP', 'Cyprus', 1),
            ('GE', 'GEO', 'Georgia', 1),
            ('IN', 'IND', 'India', 1),
            ('ID', 'IDN', 'Indonesia', 1),
            ('IR', 'IRN', 'Iran', 1),
            ('IQ', 'IRQ', 'Iraq', 1),
            ('IL', 'ISR', 'Israel', 1),
            ('JP', 'JPN', 'Japan', 1),
            ('JO', 'JOR', 'Jordan', 1),
            ('KZ', 'KAZ', 'Kazakhstan', 1),
            ('KW', 'KWT', 'Kuwait', 1),
            ('KG', 'KGZ', 'Kyrgyzstan', 1),
            ('LA', 'LAO', 'Laos', 1),
            ('LB', 'LBN', 'Lebanon', 1),
            ('MY', 'MYS', 'Malaysia', 1),
            ('MV', 'MDV', 'Maldives', 1),
            ('MN', 'MNG', 'Mongolia', 1),
            ('MM', 'MMR', 'Myanmar', 1),
            ('NP', 'NPL', 'Nepal', 1),
            ('KP', 'PRK', 'North Korea', 1),
            ('OM', 'OMN', 'Oman', 1),
            ('PK', 'PAK', 'Pakistan', 1),
            ('PS', 'PSE', 'Palestine', 1),
            ('PH', 'PHL', 'Philippines', 1),
            ('QA', 'QAT', 'Qatar', 1),
            ('SA', 'SAU', 'Saudi Arabia', 1),
            ('SG', 'SGP', 'Singapore', 1),
            ('KR', 'KOR', 'South Korea', 1),
            ('LK', 'LKA', 'Sri Lanka', 1),
            ('SY', 'SYR', 'Syria', 1),
            ('TW', 'TWN', 'Taiwan', 1),
            ('TJ', 'TJK', 'Tajikistan', 1),
            ('TH', 'THA', 'Thailand', 1),
            ('TL', 'TLS', 'Timor-Leste', 1),
            ('TR', 'TUR', 'Turkey', 1),
            ('TM', 'TKM', 'Turkmenistan', 1),
            ('AE', 'ARE', 'United Arab Emirates', 1),
            ('UZ', 'UZB', 'Uzbekistan', 1),
            ('VN', 'VNM', 'Vietnam', 1),
            ('YE', 'YEM', 'Yemen', 1),

            -- Europe (44 countries)
            ('AL', 'ALB', 'Albania', 1),
            ('AD', 'AND', 'Andorra', 1),
            ('AT', 'AUT', 'Austria', 1),
            ('BY', 'BLR', 'Belarus', 1),
            ('BE', 'BEL', 'Belgium', 1),
            ('BA', 'BIH', 'Bosnia and Herzegovina', 1),
            ('BG', 'BGR', 'Bulgaria', 1),
            ('HR', 'HRV', 'Croatia', 1),
            ('CZ', 'CZE', 'Czech Republic', 1),
            ('DK', 'DNK', 'Denmark', 1),
            ('EE', 'EST', 'Estonia', 1),
            ('FI', 'FIN', 'Finland', 1),
            ('FR', 'FRA', 'France', 1),
            ('DE', 'DEU', 'Germany', 1),
            ('GR', 'GRC', 'Greece', 1),
            ('HU', 'HUN', 'Hungary', 1),
            ('IS', 'ISL', 'Iceland', 1),
            ('IE', 'IRL', 'Ireland', 1),
            ('IT', 'ITA', 'Italy', 1),
            ('XK', 'XKX', 'Kosovo', 1),
            ('LV', 'LVA', 'Latvia', 1),
            ('LI', 'LIE', 'Liechtenstein', 1),
            ('LT', 'LTU', 'Lithuania', 1),
            ('LU', 'LUX', 'Luxembourg', 1),
            ('MK', 'MKD', 'North Macedonia', 1),
            ('MT', 'MLT', 'Malta', 1),
            ('MD', 'MDA', 'Moldova', 1),
            ('MC', 'MCO', 'Monaco', 1),
            ('ME', 'MNE', 'Montenegro', 1),
            ('NL', 'NLD', 'Netherlands', 1),
            ('NO', 'NOR', 'Norway', 1),
            ('PL', 'POL', 'Poland', 1),
            ('PT', 'PRT', 'Portugal', 1),
            ('RO', 'ROU', 'Romania', 1),
            ('RU', 'RUS', 'Russia', 1),
            ('SM', 'SMR', 'San Marino', 1),
            ('RS', 'SRB', 'Serbia', 1),
            ('SK', 'SVK', 'Slovakia', 1),
            ('SI', 'SVN', 'Slovenia', 1),
            ('ES', 'ESP', 'Spain', 1),
            ('SE', 'SWE', 'Sweden', 1),
            ('CH', 'CHE', 'Switzerland', 1),
            ('UA', 'UKR', 'Ukraine', 1),
            ('GB', 'GBR', 'United Kingdom', 1),
            ('VA', 'VAT', 'Vatican City', 1),

            -- North America (23 countries)
            ('AG', 'ATG', 'Antigua and Barbuda', 1),
            ('BS', 'BHS', 'Bahamas', 1),
            ('BB', 'BRB', 'Barbados', 1),
            ('BZ', 'BLZ', 'Belize', 1),
            ('CA', 'CAN', 'Canada', 1),
            ('CR', 'CRI', 'Costa Rica', 1),
            ('CU', 'CUB', 'Cuba', 1),
            ('DM', 'DMA', 'Dominica', 1),
            ('DO', 'DOM', 'Dominican Republic', 1),
            ('SV', 'SLV', 'El Salvador', 1),
            ('GD', 'GRD', 'Grenada', 1),
            ('GT', 'GTM', 'Guatemala', 1),
            ('HT', 'HTI', 'Haiti', 1),
            ('HN', 'HND', 'Honduras', 1),
            ('JM', 'JAM', 'Jamaica', 1),
            ('MX', 'MEX', 'Mexico', 1),
            ('NI', 'NIC', 'Nicaragua', 1),
            ('PA', 'PAN', 'Panama', 1),
            ('KN', 'KNA', 'Saint Kitts and Nevis', 1),
            ('LC', 'LCA', 'Saint Lucia', 1),
            ('VC', 'VCT', 'Saint Vincent and the Grenadines', 1),
            ('TT', 'TTO', 'Trinidad and Tobago', 1),
            ('US', 'USA', 'United States', 1),

            -- South America (12 countries)
            ('AR', 'ARG', 'Argentina', 1),
            ('BO', 'BOL', 'Bolivia', 1),
            ('BR', 'BRA', 'Brazil', 1),
            ('CL', 'CHL', 'Chile', 1),
            ('CO', 'COL', 'Colombia', 1),
            ('EC', 'ECU', 'Ecuador', 1),
            ('GY', 'GUY', 'Guyana', 1),
            ('PY', 'PRY', 'Paraguay', 1),
            ('PE', 'PER', 'Peru', 1),
            ('SR', 'SUR', 'Suriname', 1),
            ('UY', 'URY', 'Uruguay', 1),
            ('VE', 'VEN', 'Venezuela', 1),

            -- Oceania (14 countries)
            ('AU', 'AUS', 'Australia', 1),
            ('FJ', 'FJI', 'Fiji', 1),
            ('KI', 'KIR', 'Kiribati', 1),
            ('MH', 'MHL', 'Marshall Islands', 1),
            ('FM', 'FSM', 'Micronesia', 1),
            ('NR', 'NRU', 'Nauru', 1),
            ('NZ', 'NZL', 'New Zealand', 1),
            ('PW', 'PLW', 'Palau', 1),
            ('PG', 'PNG', 'Papua New Guinea', 1),
            ('WS', 'WSM', 'Samoa', 1),
            ('SB', 'SLB', 'Solomon Islands', 1),
            ('TO', 'TON', 'Tonga', 1),
            ('TV', 'TUV', 'Tuvalu', 1),
            ('VU', 'VUT', 'Vanuatu', 1),

            -- Dependencies and Territories (19)
            ('AI', 'AIA', 'Anguilla', 1),
            ('AW', 'ABW', 'Aruba', 1),
            ('BM', 'BMU', 'Bermuda', 1),
            ('VG', 'VGB', 'British Virgin Islands', 1),
            ('KY', 'CYM', 'Cayman Islands', 1),
            ('CW', 'CUW', 'Curaçao', 1),
            ('FK', 'FLK', 'Falkland Islands', 1),
            ('FO', 'FRO', 'Faroe Islands', 1),
            ('GF', 'GUF', 'French Guiana', 1),
            ('PF', 'PYF', 'French Polynesia', 1),
            ('GI', 'GIB', 'Gibraltar', 1),
            ('GL', 'GRL', 'Greenland', 1),
            ('GP', 'GLP', 'Guadeloupe', 1),
            ('GU', 'GUM', 'Guam', 1),
            ('JE', 'JEY', 'Jersey', 1),
            ('MQ', 'MTQ', 'Martinique', 1),
            ('MS', 'MSR', 'Montserrat', 1),
            ('NC', 'NCL', 'New Caledonia', 1),
            ('PR', 'PRI', 'Puerto Rico', 1);
        ";

        await _context.Database.ExecuteSqlRawAsync(sql).ConfigureAwait(false);
    }

    private List<CountryData> GetCountriesData()
    {
        // Try to load from embedded JSON file first
        try
        {
            var assembly = typeof(CountriesSeeder).Assembly;
            var resourceName = "L4H.Infrastructure.SeedData.countries.json";
            
            using var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream != null)
            {
                using var reader = new StreamReader(stream);
                var json = reader.ReadToEnd();
                var countries = JsonSerializer.Deserialize<List<CountryData>>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                if (countries != null && countries.Any())
                {
                    return countries;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not load countries from embedded JSON, falling back to sample data");
        }

        // Fallback to hardcoded sample data
        return new List<CountryData>
        {
            new() { Iso2 = "US", Iso3 = "USA", Name = "United States", IsActive = true },
            new() { Iso2 = "IN", Iso3 = "IND", Name = "India", IsActive = true },
            new() { Iso2 = "PH", Iso3 = "PHL", Name = "Philippines", IsActive = true },
            new() { Iso2 = "ES", Iso3 = "ESP", Name = "Spain", IsActive = true },
            new() { Iso2 = "AD", Iso3 = "AND", Name = "Andorra", IsActive = true }
        };
    }

    private class CountryData
    {
        public string Iso2 { get; set; } = string.Empty;
        public string Iso3 { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}