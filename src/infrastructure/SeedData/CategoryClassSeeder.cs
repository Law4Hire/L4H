using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace L4H.Infrastructure.SeedData
{
    /// <summary>
    /// Seeds CategoryClass data for visa purpose-based filtering
    /// </summary>
    public class CategoryClassSeeder : ISeedTask
    {
        private readonly L4HDbContext _context;
        private readonly ILogger<CategoryClassSeeder> _logger;

        public string Name => "CategoryClasses";

        public CategoryClassSeeder(L4HDbContext context, ILogger<CategoryClassSeeder> _logger)
        {
            _context = context;
            this._logger = _logger;
        }

        public async Task ExecuteAsync()
        {
            // Check if CategoryClasses already exist
            if (await _context.CategoryClasses.AnyAsync().ConfigureAwait(false))
            {
                _logger.LogInformation("CategoryClasses already seeded. Skipping.");
                return;
            }

            _logger.LogInformation("Seeding CategoryClasses...");

            var categories = new List<CategoryClass>
            {
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "A",
                    ClassName = "Diplomat",
                    GeneralCategory = "Other",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "B",
                    ClassName = "Business/Tourism Visitor",
                    GeneralCategory = "Tourism & Visit, Business",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "C",
                    ClassName = "Transit Visa",
                    GeneralCategory = "Tourism & Visit",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "CW",
                    ClassName = "CNMI Transitional Worker",
                    GeneralCategory = "Other",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "D",
                    ClassName = "Crewmember",
                    GeneralCategory = "Other",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "E",
                    ClassName = "Treaty Trader/Investor",
                    GeneralCategory = "Business, Employment",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "EB",
                    ClassName = "Employment-Based Immigrant",
                    GeneralCategory = "Employment, Immigrate",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "F",
                    ClassName = "Academic Student",
                    GeneralCategory = "Study & Exchange",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "G",
                    ClassName = "International Organization",
                    GeneralCategory = "Other",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "H",
                    ClassName = "Temporary Worker",
                    GeneralCategory = "Business, Employment",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "I",
                    ClassName = "Media Representative",
                    GeneralCategory = "Other",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "IR",
                    ClassName = "Immediate Relative",
                    GeneralCategory = "Immigrate",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "CR",
                    ClassName = "Conditional Resident",
                    GeneralCategory = "Immigrate",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "J",
                    ClassName = "Exchange Visitor",
                    GeneralCategory = "Study & Exchange",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "K",
                    ClassName = "Fiancé/Spouse",
                    GeneralCategory = "Immigrate",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "L",
                    ClassName = "Intracompany Transferee",
                    GeneralCategory = "Business, Employment",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "M",
                    ClassName = "Vocational Student",
                    GeneralCategory = "Study & Exchange",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "N",
                    ClassName = "Special Immigrant",
                    GeneralCategory = "Other",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "NATO",
                    ClassName = "NATO Official",
                    GeneralCategory = "Other",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "O",
                    ClassName = "Extraordinary Ability",
                    GeneralCategory = "Business, Employment",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "P",
                    ClassName = "Athlete/Entertainer",
                    GeneralCategory = "Business, Employment",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "Q",
                    ClassName = "Cultural Exchange",
                    GeneralCategory = "Study & Exchange",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "R",
                    ClassName = "Religious Worker",
                    GeneralCategory = "Other",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "S",
                    ClassName = "Witness/Informant",
                    GeneralCategory = "Other",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "SIJS",
                    ClassName = "Special Immigrant Juvenile",
                    GeneralCategory = "Immigrate",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "SIV",
                    ClassName = "Special Immigrant Visa",
                    GeneralCategory = "Immigrate",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "T",
                    ClassName = "Trafficking Victim",
                    GeneralCategory = "Other",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "TPS",
                    ClassName = "Temporary Protected Status",
                    GeneralCategory = "Other",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "TN",
                    ClassName = "NAFTA Professional",
                    GeneralCategory = "Business, Employment",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "U",
                    ClassName = "Crime Victim",
                    GeneralCategory = "Other",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "V",
                    ClassName = "Family of LPR",
                    GeneralCategory = "Immigrate",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "VAWA",
                    ClassName = "Violence Against Women Act",
                    GeneralCategory = "Immigrate",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "VWP",
                    ClassName = "Visa Waiver Program",
                    GeneralCategory = "Tourism & Visit, Business",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "WB",
                    ClassName = "Waiver Business",
                    GeneralCategory = "Tourism & Visit, Business",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CategoryClass
                {
                    Id = Guid.NewGuid(),
                    ClassCode = "WT",
                    ClassName = "Waiver Tourism",
                    GeneralCategory = "Tourism & Visit",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            await _context.CategoryClasses.AddRangeAsync(categories).ConfigureAwait(false);
            await _context.SaveChangesAsync().ConfigureAwait(false);

            _logger.LogInformation("Seeded {Count} CategoryClasses successfully", categories.Count);
        }
    }
}
