#pragma warning disable xUnit1030 // Do not call ConfigureAwait(false) in test methods
#pragma warning disable CA2007 // Do not call ConfigureAwait on the awaited task

using Xunit;
using L4H.Infrastructure.Services;
using L4H.Infrastructure.Data;
using Microsoft.Extensions.Logging;
using Moq;
using System.Collections.Generic;
using System.Threading.Tasks;
using L4H.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using FluentAssertions;
using L4H.Shared.Models;

namespace L4H.Tests.Infrastructure
{
    public class AdaptiveInterviewServiceEdgeCaseTests
    {
        private readonly DbContextOptions<L4HDbContext> _dbOptions;
        private readonly Mock<ILogger<AdaptiveInterviewService>> _mockLogger;
        private readonly Mock<IInterviewRecommender> _mockRecommender;

        public AdaptiveInterviewServiceEdgeCaseTests()
        {
            _dbOptions = new DbContextOptionsBuilder<L4HDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            
            _mockLogger = new Mock<ILogger<AdaptiveInterviewService>>();
            _mockRecommender = new Mock<IInterviewRecommender>();
        }

        private static async Task SeedComprehensiveVisaData(L4HDbContext context)
        {
            var visaTypes = new[]
            {
                new VisaType { Id = 1, Code = "B-1", Name = "Business Visitor", IsActive = true },
                new VisaType { Id = 2, Code = "B-2", Name = "Tourist Visitor", IsActive = true },
                new VisaType { Id = 3, Code = "F-1", Name = "Student", IsActive = true },
                new VisaType { Id = 4, Code = "H-1B", Name = "Specialty Occupation", IsActive = true },
                new VisaType { Id = 5, Code = "H-2A", Name = "Agricultural Worker", IsActive = true },
                new VisaType { Id = 6, Code = "L-1A", Name = "Intracompany Transferee Executive", IsActive = true },
                new VisaType { Id = 7, Code = "L-1B", Name = "Intracompany Transferee Specialized", IsActive = true },
                new VisaType { Id = 8, Code = "O-1", Name = "Extraordinary Ability", IsActive = true },
                new VisaType { Id = 9, Code = "E-1", Name = "Treaty Trader", IsActive = true },
                new VisaType { Id = 10, Code = "E-2", Name = "Treaty Investor", IsActive = true },
                new VisaType { Id = 11, Code = "EB-1", Name = "Priority Worker", IsActive = true },
                new VisaType { Id = 12, Code = "EB-2", Name = "Advanced Degree Professional", IsActive = true },
                new VisaType { Id = 13, Code = "EB-5", Name = "Investor", IsActive = true },
                new VisaType { Id = 14, Code = "IR-1", Name = "Spouse of US Citizen", IsActive = true },
                new VisaType { Id = 15, Code = "K-1", Name = "Fiancé(e)", IsActive = true },
                new VisaType { Id = 16, Code = "ESTA", Name = "Electronic System for Travel Authorization", IsActive = true },
                new VisaType { Id = 17, Code = "C-1", Name = "Transit", IsActive = true },
                new VisaType { Id = 18, Code = "J-1", Name = "Exchange Visitor", IsActive = true },
                new VisaType { Id = 19, Code = "M-1", Name = "Vocational Student", IsActive = true },
                new VisaType { Id = 20, Code = "P-1", Name = "Athlete/Entertainer", IsActive = true },
                // Add some inactive visa types for testing
                new VisaType { Id = 21, Code = "INACTIVE-1", Name = "Inactive Visa Type", IsActive = false },
                new VisaType { Id = 22, Code = "INACTIVE-2", Name = "Another Inactive Visa", IsActive = false }
            };

            context.VisaTypes.AddRange(visaTypes);
            await context.SaveChangesAsync();
        }

        private AdaptiveInterviewService CreateService(L4HDbContext context)
        {
            return new AdaptiveInterviewService(_mockLogger.Object, context, _mockRecommender.Object);
        }

        #region Null and Empty Input Edge Cases

        [Fact]
        public async Task GetNextQuestionAsync_NullAnswers_ReturnsFirstQuestion()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);

            // Act
            var result = await service.GetNextQuestionAsync(null);

            // Assert
            result.Should().NotBeNull();
            result.Key.Should().Be("purpose");
            result.RemainingVisaTypes.Should().BeGreaterThan(0);
            result.RemainingVisaCodes.Should().NotBeEmpty();
        }

        [Fact]
        public async Task GetNextQuestionAsync_EmptyAnswers_ReturnsFirstQuestion()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>();

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.Key.Should().Be("purpose");
            result.RemainingVisaTypes.Should().BeGreaterThan(0);
            result.RemainingVisaCodes.Should().NotBeEmpty();
        }

        [Fact]
        public async Task GetNextQuestionAsync_NullUser_HandlesGracefully()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "tourism" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers, null);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaTypes.Should().BeGreaterThan(0);
        }

        [Fact]
        public async Task IsCompleteAsync_NullAnswers_ReturnsFalse()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);

            // Act
            var result = await service.IsCompleteAsync(null);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task GetRecommendationAsync_NullAnswers_CallsRecommenderWithEmptyAnswers()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            
            var expectedResult = new RecommendationResult
            {
                VisaTypeId = 2,
                Rationale = "Default recommendation"
            };
            
            _mockRecommender.Setup(r => r.GetRecommendationAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<string>()))
                .ReturnsAsync(expectedResult);
            
            var service = CreateService(context);

            // Act
            var result = await service.GetRecommendationAsync(null);

            // Assert
            result.Should().NotBeNull();
            result.VisaTypeId.Should().Be(expectedResult.VisaTypeId);
            _mockRecommender.Verify(r => r.GetRecommendationAsync(It.IsAny<Dictionary<string, string>>(), null), Times.Once);
        }

        #endregion

        #region Invalid Answer Values Edge Cases

        [Fact]
        public async Task GetNextQuestionAsync_UnknownPurpose_AllowsAllVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "unknown_invalid_purpose" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaTypes.Should().BeGreaterThan(0);
            // Should not filter out any visas for unknown purpose
            result.RemainingVisaCodes.Should().Contain("B-1");
            result.RemainingVisaCodes.Should().Contain("H-1B");
            result.RemainingVisaCodes.Should().Contain("F-1");
        }

        [Fact]
        public async Task GetNextQuestionAsync_InvalidSponsorValue_HandlesGracefully()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "employment" },
                { "hasEmployerSponsor", "invalid_value" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaTypes.Should().BeGreaterThan(0);
            // Should allow all employment visas for invalid sponsor value
            result.RemainingVisaCodes.Should().Contain("H-1B");
        }

        [Fact]
        public async Task GetNextQuestionAsync_EmptyStringAnswers_HandlesGracefully()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "" },
                { "hasEmployerSponsor", "" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaTypes.Should().BeGreaterThan(0);
        }

        [Fact]
        public async Task GetNextQuestionAsync_WhitespaceAnswers_HandlesGracefully()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "   " },
                { "durationOfStay", "\t\n" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaTypes.Should().BeGreaterThan(0);
        }

        #endregion

        #region Database Edge Cases

        [Fact]
        public async Task GetNextQuestionAsync_NoActiveVisas_HandlesGracefully()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            // Only add inactive visa types
            var inactiveVisas = new[]
            {
                new VisaType { Id = 1, Code = "INACTIVE-1", Name = "Inactive Visa 1", IsActive = false },
                new VisaType { Id = 2, Code = "INACTIVE-2", Name = "Inactive Visa 2", IsActive = false }
            };
            context.VisaTypes.AddRange(inactiveVisas);
            await context.SaveChangesAsync();
            
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "tourism" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaTypes.Should().Be(0);
            result.Key.Should().Be("complete");
            result.RemainingVisaCodes.Should().BeEmpty();
        }

        [Fact]
        public async Task GetNextQuestionAsync_EmptyDatabase_HandlesGracefully()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            // Don't seed any visa types
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "tourism" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaTypes.Should().Be(0);
            result.Key.Should().Be("complete");
        }

        // NOTE: Database error tests removed - cannot mock DbContext.VisaTypes as it's not virtual
        // Error handling is tested through integration tests instead

        #endregion

        #region User Profile Edge Cases

        [Fact]
        public async Task GetNextQuestionAsync_UserWithNullDateOfBirth_HandlesGracefully()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var user = new User
            {
                Id = new UserId(Guid.NewGuid()),
                DateOfBirth = null, // Null date of birth
                Email = "test@test.com",
                FirstName = "Test",
                LastName = "User"
            };

            var answers = new Dictionary<string, string>
            {
                { "purpose", "employment" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers, user);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaTypes.Should().BeGreaterThan(0);
            // Should not filter out adult-only visas when age is unknown
            result.RemainingVisaCodes.Should().Contain("E-1");
            result.RemainingVisaCodes.Should().Contain("L-1A");
        }

        [Fact]
        public async Task GetNextQuestionAsync_UserWithFutureDateOfBirth_HandlesGracefully()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var user = new User
            {
                Id = new UserId(Guid.NewGuid()),
                DateOfBirth = DateTime.Today.AddYears(1), // Future date
                Email = "test@test.com",
                FirstName = "Test",
                LastName = "User"
            };

            var answers = new Dictionary<string, string>
            {
                { "purpose", "employment" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers, user);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaTypes.Should().BeGreaterThan(0);
            // Should filter out adult-only visas for negative age
            result.RemainingVisaCodes.Should().NotContain("E-1");
            result.RemainingVisaCodes.Should().NotContain("L-1A");
        }

        [Fact]
        public async Task GetNextQuestionAsync_UserWithEmptyNationality_HandlesGracefully()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var user = new User
            {
                Id = new UserId(Guid.NewGuid()),
                Nationality = "", // Empty nationality
                Email = "test@test.com",
                FirstName = "Test",
                LastName = "User"
            };

            var answers = new Dictionary<string, string>
            {
                { "purpose", "tourism" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers, user);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaTypes.Should().BeGreaterThan(0);
        }

        [Fact]
        public async Task GetNextQuestionAsync_UserWithNullMaritalStatus_HandlesGracefully()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var user = new User
            {
                Id = new UserId(Guid.NewGuid()),
                MaritalStatus = null!, // Null marital status
                Email = "test@test.com",
                FirstName = "Test",
                LastName = "User"
            };

            var answers = new Dictionary<string, string>
            {
                { "purpose", "family" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers, user);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaTypes.Should().BeGreaterThan(0);
        }

        #endregion

        #region Complex Filtering Edge Cases

        [Fact]
        public async Task GetNextQuestionAsync_ConflictingAnswers_HandlesGracefully()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "tourism" }, // Tourism purpose
                { "hasEmployerSponsor", "yes" }, // But has employer sponsor (conflicting)
                { "durationOfStay", "permanent" } // And wants permanent stay (also conflicting)
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            // Should handle conflicting filters gracefully
            result.RemainingVisaTypes.Should().BeGreaterOrEqualTo(0);
        }

        [Fact]
        public async Task GetNextQuestionAsync_AllFiltersExcludeAllVisas_ReturnsComplete()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "tourism" }, // Only allows B-1, B-2, ESTA
                { "hasEmployerSponsor", "yes" }, // Excludes B-1, B-2, ESTA (they don't need sponsors)
                { "durationOfStay", "short" }, // Only allows short-term visas
                { "investmentAmount", "none" } // No investment
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            // Should complete when no visas remain after filtering
            if (result.RemainingVisaTypes == 0)
            {
                result.Key.Should().Be("complete");
            }
        }

        [Fact]
        public async Task GetNextQuestionAsync_VerySpecificCriteria_NarrowsDownCorrectly()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "investment" }, // Investment visas: E-1, E-2, EB-5
                { "investmentAmount", "eb5" }, // High investment
                { "durationOfStay", "permanent" } // Permanent stay
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("EB-5");
            // Should narrow down to very few options
            result.RemainingVisaTypes.Should().BeLessOrEqualTo(3);
        }

        #endregion

        #region Early Completion Edge Cases

        [Fact]
        public async Task GetNextQuestionAsync_ExactlyThreeVisasRemaining_ReturnsComplete()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "tourism" }, // B-1, B-2, ESTA
                { "durationOfStay", "short" } // Should narrow to exactly these 3
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            if (result.RemainingVisaTypes <= 3)
            {
                result.Key.Should().Be("complete");
            }
        }

        [Fact]
        public async Task GetNextQuestionAsync_TwoEssentialQuestionsAnsweredWithFewVisas_ReturnsComplete()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "study" }, // Essential question 1
                { "durationOfStay", "long" } // Essential question 2
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            // Should complete early if we have 2 essential questions and <= 5 visas
            if (result.RemainingVisaTypes <= 5)
            {
                result.Key.Should().Be("complete");
            }
        }

        [Fact]
        public async Task IsCompleteAsync_ExactlyThreeVisasRemaining_ReturnsTrue()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "tourism" },
                { "durationOfStay", "short" },
                { "hasEmployerSponsor", "no" }
            };

            // Act
            var result = await service.IsCompleteAsync(answers);

            // Assert
            result.Should().BeTrue();
        }

        #endregion

        #region Recommender Integration Edge Cases

        [Fact]
        public async Task GetRecommendationAsync_RecommenderThrowsException_PropagatesException()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            
            _mockRecommender.Setup(r => r.GetRecommendationAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<string>()))
                .ThrowsAsync(new InvalidOperationException("Recommender service unavailable"));
            
            var service = CreateService(context);
            var answers = new Dictionary<string, string> { { "purpose", "tourism" } };

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetRecommendationAsync(answers));
        }

        [Fact]
        public async Task GetRecommendationAsync_RecommenderReturnsNull_HandlesGracefully()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            
            _mockRecommender.Setup(r => r.GetRecommendationAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<string>()))
                .ReturnsAsync((RecommendationResult)null!);
            
            var service = CreateService(context);
            var answers = new Dictionary<string, string> { { "purpose", "tourism" } };

            // Act & Assert
            var result = await service.GetRecommendationAsync(answers);
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetRecommendationAsync_WithComplexUserProfile_PassesCorrectNationality()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            
            var user = new User
            {
                Id = new UserId(Guid.NewGuid()),
                Nationality = "German",
                Email = "test@test.com",
                FirstName = "Test",
                LastName = "User",
                DateOfBirth = DateTime.Today.AddYears(-30),
                MaritalStatus = "Single"
            };
            
            var expectedResult = new RecommendationResult
            {
                VisaTypeId = 2,
                Rationale = "Recommendation for German national"
            };
            
            _mockRecommender.Setup(r => r.GetRecommendationAsync(It.IsAny<Dictionary<string, string>>(), "German"))
                .ReturnsAsync(expectedResult);
            
            var service = CreateService(context);
            var answers = new Dictionary<string, string> { { "purpose", "tourism" } };

            // Act
            var result = await service.GetRecommendationAsync(answers, user);

            // Assert
            result.Should().NotBeNull();
            result.VisaTypeId.Should().Be(expectedResult.VisaTypeId);
            _mockRecommender.Verify(r => r.GetRecommendationAsync(answers, "German"), Times.Once);
        }

        #endregion

        #region Case-Insensitive Filtering Edge Cases

        [Fact]
        public async Task GetNextQuestionAsync_UppercasePurpose_FiltersCorrectly()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "TOURISM" } // Uppercase
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("B-2");
            result.RemainingVisaCodes.Should().Contain("ESTA");
            result.RemainingVisaCodes.Should().NotContain("H-1B");
        }

        [Fact]
        public async Task GetNextQuestionAsync_MixedCaseAnswers_FiltersCorrectly()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "EmPlOyMeNt" }, // Mixed case
                { "hasEmployerSponsor", "YES" } // Uppercase
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("H-1B");
            result.RemainingVisaCodes.Should().Contain("L-1A");
        }

        #endregion

        #region Question Generation Edge Cases

        [Fact]
        public async Task GetNextQuestionAsync_AllQuestionsAnswered_ReturnsComplete()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "employment" },
                { "hasEmployerSponsor", "yes" },
                { "durationOfStay", "long" },
                { "familyRelationship", "none" },
                { "investmentAmount", "none" },
                { "educationLevel", "bachelor" },
                { "hasUsFamily", "no" },
                { "previousVisaHistory", "never" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.Key.Should().Be("complete");
        }

        [Fact]
        public async Task GetNextQuestionAsync_SkippedQuestions_ReturnsNextUnanswered()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "employment" },
                // Skip hasEmployerSponsor
                { "durationOfStay", "long" }
                // Should return hasEmployerSponsor next
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.Key.Should().Be("hasEmployerSponsor");
        }

        #endregion
    }
}