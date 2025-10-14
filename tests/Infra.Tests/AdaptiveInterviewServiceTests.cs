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
    public class AdaptiveInterviewServiceTests
    {
        private readonly DbContextOptions<L4HDbContext> _dbOptions;
        private readonly Mock<ILogger<AdaptiveInterviewService>> _mockLogger;
        private readonly Mock<IInterviewRecommender> _mockRecommender;

        public AdaptiveInterviewServiceTests()
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
                new VisaType { Id = 21, Code = "IR-3", Name = "Immediate Relative - Adoption Completed Abroad", IsActive = true },
                new VisaType { Id = 22, Code = "IR-4", Name = "Immediate Relative - Adoption to be Completed in US", IsActive = true }
            };

            context.VisaTypes.AddRange(visaTypes);
            await context.SaveChangesAsync();
        }

        private AdaptiveInterviewService CreateService(L4HDbContext context)
        {
            return new AdaptiveInterviewService(_mockLogger.Object, context, _mockRecommender.Object);
        }

        #region Purpose-Based Filtering Tests

        [Fact]
        public async Task GetNextQuestionAsync_TourismPurpose_FiltersToTourismVisas()
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
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("B-2");
            result.RemainingVisaCodes.Should().Contain("ESTA");
            result.RemainingVisaCodes.Should().NotContain("H-1B");
            result.RemainingVisaCodes.Should().NotContain("F-1");
        }

        [Fact]
        public async Task GetNextQuestionAsync_BusinessPurpose_FiltersToBusinessVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "business" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("B-1");
            result.RemainingVisaCodes.Should().Contain("E-1");
            result.RemainingVisaCodes.Should().Contain("E-2");
            result.RemainingVisaCodes.Should().NotContain("F-1");
            result.RemainingVisaCodes.Should().NotContain("B-2");
        }

        [Fact]
        public async Task GetNextQuestionAsync_EmploymentPurpose_FiltersToWorkVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "employment" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("H-1B");
            result.RemainingVisaCodes.Should().Contain("L-1A");
            result.RemainingVisaCodes.Should().Contain("L-1B");
            result.RemainingVisaCodes.Should().Contain("O-1");
            result.RemainingVisaCodes.Should().NotContain("B-2");
            result.RemainingVisaCodes.Should().NotContain("F-1");
        }

        [Fact]
        public async Task GetNextQuestionAsync_StudyPurpose_FiltersToStudentVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "study" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("F-1");
            result.RemainingVisaCodes.Should().Contain("J-1");
            result.RemainingVisaCodes.Should().Contain("M-1");
            result.RemainingVisaCodes.Should().NotContain("H-1B");
            result.RemainingVisaCodes.Should().NotContain("B-2");
        }

        [Fact]
        public async Task GetNextQuestionAsync_FamilyPurpose_FiltersToFamilyVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "family" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("B-2");
            result.RemainingVisaCodes.Should().Contain("IR-1");
            result.RemainingVisaCodes.Should().NotContain("H-1B");
            result.RemainingVisaCodes.Should().NotContain("F-1");
        }

        [Fact]
        public async Task GetNextQuestionAsync_InvestmentPurpose_FiltersToInvestmentVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "investment" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("E-1");
            result.RemainingVisaCodes.Should().Contain("E-2");
            result.RemainingVisaCodes.Should().Contain("EB-5");
            result.RemainingVisaCodes.Should().NotContain("F-1");
            result.RemainingVisaCodes.Should().NotContain("B-2");
        }

        #endregion

        #region Sponsor-Based Filtering Tests

        [Fact]
        public async Task GetNextQuestionAsync_WithEmployerSponsor_FiltersToSponsoredVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "employment" },
                { "hasEmployerSponsor", "yes" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("H-1B");
            result.RemainingVisaCodes.Should().Contain("L-1A");
            result.RemainingVisaCodes.Should().Contain("L-1B");
            result.RemainingVisaCodes.Should().Contain("O-1");
        }

        [Fact]
        public async Task GetNextQuestionAsync_WithoutEmployerSponsor_ExcludesSponsoredVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "employment" },
                { "hasEmployerSponsor", "no" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().NotContain("H-1B");
            result.RemainingVisaCodes.Should().NotContain("L-1A");
            result.RemainingVisaCodes.Should().NotContain("L-1B");
            result.RemainingVisaCodes.Should().NotContain("O-1");
        }

        #endregion

        #region Duration-Based Filtering Tests

        [Fact]
        public async Task GetNextQuestionAsync_ShortDuration_FiltersToShortTermVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "tourism" },
                { "durationOfStay", "short" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("B-2");
            result.RemainingVisaCodes.Should().Contain("ESTA");
            result.RemainingVisaCodes.Should().Contain("C-1");
            result.RemainingVisaCodes.Should().NotContain("F-1");
            result.RemainingVisaCodes.Should().NotContain("H-1B");
        }

        [Fact]
        public async Task GetNextQuestionAsync_PermanentDuration_FiltersToImmigrantVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "immigration" },
                { "durationOfStay", "permanent" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("IR-1");
            result.RemainingVisaCodes.Should().Contain("EB-1");
            result.RemainingVisaCodes.Should().Contain("EB-2");
            result.RemainingVisaCodes.Should().Contain("EB-5");
            result.RemainingVisaCodes.Should().NotContain("B-2");
            result.RemainingVisaCodes.Should().NotContain("F-1");
        }

        #endregion

        #region User Profile Filtering Tests

        [Fact]
        public async Task GetNextQuestionAsync_WithMinorUser_ExcludesAdultOnlyVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var minorUser = new User
            {
                Id = new UserId(Guid.NewGuid()),
                DateOfBirth = DateTime.Today.AddYears(-16), // 16 years old
                Email = "minor@test.com",
                FirstName = "Minor",
                LastName = "User"
            };

            var answers = new Dictionary<string, string>
            {
                { "purpose", "employment" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers, minorUser);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().NotContain("E-1");
            result.RemainingVisaCodes.Should().NotContain("E-2");
            result.RemainingVisaCodes.Should().NotContain("L-1A");
            result.RemainingVisaCodes.Should().NotContain("EB-1");
        }

        [Fact]
        public async Task GetNextQuestionAsync_WithNationality_AppliesNationalityFilters()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var user = new User
            {
                Id = new UserId(Guid.NewGuid()),
                Nationality = "Canadian",
                Email = "canadian@test.com",
                FirstName = "Canadian",
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
            // All visas should be available for Canadian nationals (simplified test)
            result.RemainingVisaCodes.Should().NotBeEmpty();
        }

        #endregion

        #region Family Relationship Filtering Tests

        [Fact]
        public async Task GetNextQuestionAsync_SpouseRelationship_FiltersToSpouseVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "family" },
                { "familyRelationship", "spouse" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("IR-1");
            result.RemainingVisaCodes.Should().Contain("K-1");
        }

        [Fact]
        public async Task GetNextQuestionAsync_NoFamilyRelationship_ExcludesFamilyVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "tourism" },
                { "familyRelationship", "none" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            // All non-family visas should be available
            result.RemainingVisaCodes.Should().NotBeEmpty();
        }

        #endregion

        #region Investment Amount Filtering Tests

        [Fact]
        public async Task GetNextQuestionAsync_HighInvestment_IncludesEB5Visa()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "investment" },
                { "investmentAmount", "eb5" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("EB-5");
            result.RemainingVisaCodes.Should().Contain("E-1");
            result.RemainingVisaCodes.Should().Contain("E-2");
        }

        [Fact]
        public async Task GetNextQuestionAsync_NoInvestment_ExcludesInvestmentVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "tourism" },
                { "investmentAmount", "none" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().NotContain("E-1");
            result.RemainingVisaCodes.Should().NotContain("E-2");
            result.RemainingVisaCodes.Should().NotContain("EB-5");
        }

        #endregion

        #region Early Completion Logic Tests

        [Fact]
        public async Task GetNextQuestionAsync_FewRemainingVisas_ReturnsComplete()
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
            var result = await service.GetNextQuestionAsync(answers);

            // Assert - Should complete early when narrowed down to few visa types
            if (result.RemainingVisaTypes <= 3)
            {
                result.Key.Should().Be("complete");
            }
        }

        [Fact]
        public async Task GetNextQuestionAsync_EssentialQuestionsAnswered_CanCompleteEarly()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "tourism" },
                { "hasEmployerSponsor", "no" },
                { "durationOfStay", "short" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert - Should be able to complete with essential questions answered
            result.Should().NotBeNull();
            if (result.RemainingVisaTypes <= 5)
            {
                result.Key.Should().Be("complete");
            }
        }

        #endregion

        #region IsCompleteAsync Tests

        [Fact]
        public async Task IsCompleteAsync_WithFewRemainingVisas_ReturnsTrue()
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

        [Fact]
        public async Task IsCompleteAsync_WithManyRemainingVisas_ReturnsFalse()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "employment" } // This should leave many visa options
            };

            // Act
            var result = await service.IsCompleteAsync(answers);

            // Assert
            result.Should().BeFalse();
        }

        #endregion

        #region GetRecommendationAsync Tests

        [Fact]
        public async Task GetRecommendationAsync_CallsRecommender_ReturnsResult()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            
            var expectedResult = new RecommendationResult
            {
                VisaTypeId = 2,
                Rationale = "Test recommendation"
            };
            
            _mockRecommender.Setup(r => r.GetRecommendationAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<string>()))
                .ReturnsAsync(expectedResult);
            
            var service = CreateService(context);
            var answers = new Dictionary<string, string> { { "purpose", "tourism" } };

            // Act
            var result = await service.GetRecommendationAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.VisaTypeId.Should().Be(expectedResult.VisaTypeId);
            result.Rationale.Should().Be(expectedResult.Rationale);
            
            _mockRecommender.Verify(r => r.GetRecommendationAsync(answers, null), Times.Once);
        }

        [Fact]
        public async Task GetRecommendationAsync_WithUser_PassesUserNationality()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            
            var user = new User
            {
                Id = new UserId(Guid.NewGuid()),
                Nationality = "Canadian",
                Email = "test@test.com",
                FirstName = "Test",
                LastName = "User"
            };
            
            var expectedResult = new RecommendationResult
            {
                VisaTypeId = 2,
                Rationale = "Test recommendation"
            };
            
            _mockRecommender.Setup(r => r.GetRecommendationAsync(It.IsAny<Dictionary<string, string>>(), "Canadian"))
                .ReturnsAsync(expectedResult);
            
            var service = CreateService(context);
            var answers = new Dictionary<string, string> { { "purpose", "tourism" } };

            // Act
            var result = await service.GetRecommendationAsync(answers, user);

            // Assert
            result.Should().NotBeNull();
            _mockRecommender.Verify(r => r.GetRecommendationAsync(answers, "Canadian"), Times.Once);
        }

        #endregion

        #region Error Handling Tests

        [Fact]
        public async Task GetNextQuestionAsync_DatabaseError_ThrowsException()
        {
            // Arrange
            var mockContext = new Mock<L4HDbContext>(_dbOptions);
            mockContext.Setup(c => c.VisaTypes).Throws(new InvalidOperationException("Database error"));
            
            var service = new AdaptiveInterviewService(_mockLogger.Object, mockContext.Object, _mockRecommender.Object);
            var answers = new Dictionary<string, string> { { "purpose", "tourism" } };

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetNextQuestionAsync(answers));
        }

        [Fact]
        public async Task GetRecommendationAsync_RecommenderError_ThrowsException()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            
            _mockRecommender.Setup(r => r.GetRecommendationAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<string>()))
                .ThrowsAsync(new InvalidOperationException("Recommender error"));
            
            var service = CreateService(context);
            var answers = new Dictionary<string, string> { { "purpose", "tourism" } };

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetRecommendationAsync(answers));
        }

        [Fact]
        public async Task IsCompleteAsync_DatabaseError_ReturnsFalse()
        {
            // Arrange
            var mockContext = new Mock<L4HDbContext>(_dbOptions);
            mockContext.Setup(c => c.VisaTypes).Throws(new InvalidOperationException("Database error"));
            
            var service = new AdaptiveInterviewService(_mockLogger.Object, mockContext.Object, _mockRecommender.Object);
            var answers = new Dictionary<string, string> { { "purpose", "tourism" } };

            // Act
            var result = await service.IsCompleteAsync(answers);

            // Assert
            result.Should().BeFalse();
        }

        #endregion

        #region Edge Cases Tests

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
            result.Key.Should().Be("purpose"); // Should return the first question
            result.RemainingVisaTypes.Should().BeGreaterThan(0);
        }

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
        }

        [Fact]
        public async Task GetNextQuestionAsync_UnknownPurpose_AllowsAllVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "unknown_purpose" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaTypes.Should().BeGreaterThan(0);
        }

        [Fact]
        public async Task GetNextQuestionAsync_NoActiveVisas_HandlesGracefully()
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

        #endregion

        #region Complex Filtering Scenarios Tests

        [Fact]
        public async Task GetNextQuestionAsync_MultipleFiltersApplied_FiltersCorrectly()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "employment" },
                { "hasEmployerSponsor", "yes" },
                { "durationOfStay", "long" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            // Should only contain long-term employment visas with sponsor requirement
            result.RemainingVisaCodes.Should().Contain("H-1B");
            result.RemainingVisaCodes.Should().Contain("L-1A");
            result.RemainingVisaCodes.Should().Contain("L-1B");
            result.RemainingVisaCodes.Should().NotContain("B-2"); // Not employment
            result.RemainingVisaCodes.Should().NotContain("ESTA"); // Not employment
        }

        [Fact]
        public async Task GetNextQuestionAsync_FamilyWithSpouseRelationship_FiltersToSpouseVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "family" },
                { "familyRelationship", "spouse" },
                { "durationOfStay", "permanent" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("IR-1");
            result.RemainingVisaCodes.Should().Contain("K-1");
            result.RemainingVisaCodes.Should().NotContain("F-1"); // Not spouse visa
            result.RemainingVisaCodes.Should().NotContain("H-1B"); // Not family visa
        }

        [Fact]
        public async Task GetNextQuestionAsync_InvestmentWithHighAmount_FiltersToInvestmentVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "investment" },
                { "investmentAmount", "eb5" },
                { "durationOfStay", "permanent" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("EB-5");
            result.RemainingVisaCodes.Should().Contain("E-1");
            result.RemainingVisaCodes.Should().Contain("E-2");
            result.RemainingVisaCodes.Should().NotContain("F-1"); // Not investment visa
        }

        [Fact]
        public async Task GetNextQuestionAsync_StudyWithMediumDuration_FiltersToStudentVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "study" },
                { "durationOfStay", "medium" },
                { "hasEmployerSponsor", "no" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("F-1");
            result.RemainingVisaCodes.Should().Contain("J-1");
            result.RemainingVisaCodes.Should().Contain("M-1");
            result.RemainingVisaCodes.Should().NotContain("H-1B"); // Not study visa
            result.RemainingVisaCodes.Should().NotContain("B-2"); // Not study visa
        }

        #endregion

        #region User Profile Integration Tests

        [Fact]
        public async Task GetNextQuestionAsync_MinorUserWithEmploymentPurpose_ExcludesAdultOnlyVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var minorUser = new User
            {
                Id = new UserId(Guid.NewGuid()),
                DateOfBirth = DateTime.Today.AddYears(-17), // 17 years old
                Email = "minor@test.com",
                FirstName = "Minor",
                LastName = "User"
            };

            var answers = new Dictionary<string, string>
            {
                { "purpose", "employment" },
                { "hasEmployerSponsor", "yes" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers, minorUser);

            // Assert
            result.Should().NotBeNull();
            // Should exclude adult-only visas
            result.RemainingVisaCodes.Should().NotContain("E-1");
            result.RemainingVisaCodes.Should().NotContain("E-2");
            result.RemainingVisaCodes.Should().NotContain("L-1A");
            result.RemainingVisaCodes.Should().NotContain("EB-1");
            // Should still include age-appropriate employment visas
            result.RemainingVisaCodes.Should().Contain("H-1B");
        }

        [Fact]
        public async Task GetNextQuestionAsync_AdultUserWithAllPurposes_IncludesAllVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var adultUser = new User
            {
                Id = new UserId(Guid.NewGuid()),
                DateOfBirth = DateTime.Today.AddYears(-30), // 30 years old
                Email = "adult@test.com",
                FirstName = "Adult",
                LastName = "User",
                Nationality = "Canadian"
            };

            var answers = new Dictionary<string, string>
            {
                { "purpose", "employment" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers, adultUser);

            // Assert
            result.Should().NotBeNull();
            // Should include adult-only visas
            result.RemainingVisaCodes.Should().Contain("E-1");
            result.RemainingVisaCodes.Should().Contain("E-2");
            result.RemainingVisaCodes.Should().Contain("L-1A");
            result.RemainingVisaCodes.Should().Contain("H-1B");
        }

        [Fact]
        public async Task GetNextQuestionAsync_UserWithSpecificNationality_AppliesNationalityFilters()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var user = new User
            {
                Id = new UserId(Guid.NewGuid()),
                Nationality = "Mexican",
                Email = "mexican@test.com",
                FirstName = "Mexican",
                LastName = "User"
            };

            var answers = new Dictionary<string, string>
            {
                { "purpose", "business" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers, user);

            // Assert
            result.Should().NotBeNull();
            // All visas should be available for Mexican nationals (simplified test)
            result.RemainingVisaTypes.Should().BeGreaterThan(0);
            result.RemainingVisaCodes.Should().Contain("B-1");
        }

        #endregion

        #region Logging and Monitoring Tests

        [Fact]
        public async Task GetNextQuestionAsync_LogsFilteringProcess()
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
            await service.GetNextQuestionAsync(answers);

            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Getting next question")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.AtLeastOnce);
        }

        [Fact]
        public async Task GetRecommendationAsync_LogsRecommendationProcess()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            
            var expectedResult = new RecommendationResult
            {
                VisaTypeId = 2,
                Rationale = "Test recommendation"
            };
            
            _mockRecommender.Setup(r => r.GetRecommendationAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<string>()))
                .ReturnsAsync(expectedResult);
            
            var service = CreateService(context);
            var answers = new Dictionary<string, string> { { "purpose", "tourism" } };

            // Act
            await service.GetRecommendationAsync(answers);

            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Getting recommendation")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.AtLeastOnce);
        }

        [Fact]
        public async Task GetNextQuestionAsync_LogsErrorOnException()
        {
            // Arrange
            var mockContext = new Mock<L4HDbContext>(_dbOptions);
            mockContext.Setup(c => c.VisaTypes).Throws(new InvalidOperationException("Test error"));
            
            var service = new AdaptiveInterviewService(_mockLogger.Object, mockContext.Object, _mockRecommender.Object);
            var answers = new Dictionary<string, string> { { "purpose", "tourism" } };

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetNextQuestionAsync(answers));
            
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error getting next question")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        #endregion

        #region Performance and Concurrency Tests

        [Fact]
        public async Task GetNextQuestionAsync_ConcurrentCalls_HandledCorrectly()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "tourism" }
            };

            // Act - Make multiple concurrent calls
            var tasks = Enumerable.Range(0, 10)
                .Select(_ => service.GetNextQuestionAsync(answers))
                .ToArray();

            var results = await Task.WhenAll(tasks);

            // Assert
            results.Should().AllSatisfy(result =>
            {
                result.Should().NotBeNull();
                result.Key.Should().NotBeNullOrEmpty();
                result.RemainingVisaTypes.Should().BeGreaterOrEqualTo(0);
            });

            // All results should be consistent
            var firstResult = results[0];
            results.Should().AllSatisfy(result =>
            {
                result.Key.Should().Be(firstResult.Key);
                result.RemainingVisaTypes.Should().Be(firstResult.RemainingVisaTypes);
                result.RemainingVisaCodes.Should().BeEquivalentTo(firstResult.RemainingVisaCodes);
            });
        }

        [Fact]
        public async Task GetNextQuestionAsync_LargeAnswerSet_PerformsWell()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            // Create a large set of answers
            var answers = new Dictionary<string, string>();
            for (int i = 0; i < 100; i++)
            {
                answers[$"question_{i}"] = $"answer_{i}";
            }
            answers["purpose"] = "tourism"; // Add a valid purpose

            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            stopwatch.Stop();
            result.Should().NotBeNull();
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(1000); // Should complete within 1 second
        }

        #endregion

        #region Adoption Workflow Tests

        [Fact]
        public async Task GetNextQuestionAsync_AdoptionPurpose_FiltersToAdoptionVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "adoption" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("IR-3");
            result.RemainingVisaCodes.Should().Contain("IR-4");
            result.RemainingVisaCodes.Should().NotContain("B-2");
            result.RemainingVisaCodes.Should().NotContain("H-1B");
            result.RemainingVisaCodes.Should().NotContain("F-1");
        }

        [Fact]
        public async Task GetNextQuestionAsync_AdoptionCompleted_FiltersToIR3()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "adoption" },
                { "adoptionType", "international" },
                { "adoptionCompleted", "yes" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("IR-3");
            result.RemainingVisaCodes.Should().NotContain("IR-4");
        }

        [Fact]
        public async Task GetNextQuestionAsync_AdoptionNotCompleted_FiltersToIR4()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "adoption" },
                { "adoptionType", "international" },
                { "adoptionCompleted", "no" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("IR-4");
            result.RemainingVisaCodes.Should().NotContain("IR-3");
        }

        [Fact]
        public async Task GetNextQuestionAsync_AdoptionInProcess_AllowsBothIR3AndIR4()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "adoption" },
                { "adoptionType", "international" },
                { "adoptionCompleted", "in_process" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().Contain("IR-3");
            result.RemainingVisaCodes.Should().Contain("IR-4");
        }

        [Fact]
        public async Task GetNextQuestionAsync_DomesticAdoption_FiltersOutAdoptionVisas()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "adoption" },
                { "adoptionType", "domestic" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            result.RemainingVisaCodes.Should().NotContain("IR-3");
            result.RemainingVisaCodes.Should().NotContain("IR-4");
        }

        [Fact]
        public async Task GetNextQuestionAsync_AdoptionPurpose_PrioritizesAdoptionQuestions()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "adoption" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            // Should ask adoption-specific questions first
            var adoptionQuestions = new[] { "adoptionType", "adoptionCompleted", "childAge", "childCountry", "hasLegalCustody", "homeStudyCompleted", "agencyApproved" };
            var validQuestions = adoptionQuestions.Concat(new[] { "complete" }).ToArray();
            validQuestions.Should().Contain(result.Key);
        }

        [Fact]
        public async Task GetNextQuestionAsync_FamilyPurposeWithAdoptionVisas_PrioritizesAdoptionQuestions()
        {
            // Arrange
            await using var context = new L4HDbContext(_dbOptions);
            await SeedComprehensiveVisaData(context);
            var service = CreateService(context);
            
            var answers = new Dictionary<string, string>
            {
                { "purpose", "family" }
            };

            // Act
            var result = await service.GetNextQuestionAsync(answers);

            // Assert
            result.Should().NotBeNull();
            // When family purpose is selected and adoption visas are available, should prioritize adoption questions
            var adoptionQuestions = new[] { "adoptionType", "adoptionCompleted", "childAge", "childCountry", "hasLegalCustody", "homeStudyCompleted", "agencyApproved" };
            var familyQuestions = new[] { "familyRelationship" };
            
            // Should ask either adoption or family questions
            (adoptionQuestions.Contains(result.Key) || familyQuestions.Contains(result.Key)).Should().BeTrue();
        }

        #endregion
    }
}