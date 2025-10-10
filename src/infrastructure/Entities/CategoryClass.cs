using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace L4H.Infrastructure.Entities
{
    /// <summary>
    /// Represents a visa class category (A, B, E, F, H, etc.) with its general purpose category
    /// Used for filtering visa types by purpose (employment, study, tourism, etc.)
    /// </summary>
    [Table("CategoryClasses")]
    public class CategoryClass
    {
        [Key]
        public Guid Id { get; set; }

        /// <summary>
        /// Visa class code (A, B, E, F, H, IR, CR, K, etc.)
        /// </summary>
        [Required]
        [MaxLength(10)]
        public string ClassCode { get; set; } = string.Empty;

        /// <summary>
        /// Human-readable name of the class (e.g., "Academic Student", "Temporary Worker")
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string ClassName { get; set; } = string.Empty;

        /// <summary>
        /// General category for purpose-based filtering
        /// Examples: "Employment", "Study & Exchange", "Tourism & Visit", "Business", "Immigrate", "Other"
        /// Can be comma-separated for multi-purpose categories (e.g., "Business, Employment")
        /// </summary>
        [Required]
        [MaxLength(200)]
        public string GeneralCategory { get; set; } = string.Empty;

        /// <summary>
        /// Whether this category class is currently active
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// When this record was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// When this record was last updated
        /// </summary>
        public DateTime UpdatedAt { get; set; }

        /// <summary>
        /// Checks if this category class matches the specified purpose
        /// </summary>
        /// <param name="purpose">Purpose to check (employment, study, tourism, family, etc.)</param>
        /// <returns>True if this category matches the purpose</returns>
        public bool MatchesPurpose(string purpose)
        {
            if (string.IsNullOrEmpty(purpose))
                return true; // No purpose filter means all match

            var normalizedPurpose = purpose.ToLowerInvariant().Trim();
            var normalizedCategory = GeneralCategory.ToLowerInvariant();

            // Map common purpose values to category strings
            return normalizedPurpose switch
            {
                "employment" or "work" => normalizedCategory.Contains("employment") || normalizedCategory.Contains("business"),
                "study" or "student" or "education" => normalizedCategory.Contains("study") || normalizedCategory.Contains("exchange"),
                "tourism" or "visit" or "travel" => normalizedCategory.Contains("tourism") || normalizedCategory.Contains("visit"),
                "business" => normalizedCategory.Contains("business") || normalizedCategory.Contains("employment"),
                "family" or "immigrate" or "immigration" => normalizedCategory.Contains("immigrate"),
                _ => true // Unknown purpose, don't filter
            };
        }
    }
}
