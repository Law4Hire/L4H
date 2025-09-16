using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Security.Claims;
using System.Text.Json;
using System.Globalization;

namespace L4H.Api.Controllers;

[ApiController]
[Route("v1/admin")]
[Authorize]
[Tags("Admin")]
public class AdminController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IStringLocalizer<Shared> _localizer;

    public AdminController(L4HDbContext context, IStringLocalizer<Shared> localizer)
    {
        _context = context;
        _localizer = localizer;
    }

    /// <summary>
    /// Get all visa types with pricing rules for admin management
    /// </summary>
    /// <returns>Visa types with their pricing rules grouped by country and package</returns>
    [HttpGet("pricing/visa-types")]
    [ProducesResponseType(typeof(AdminVisaTypesResponse[]), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminVisaTypesResponse[]>> GetAdminVisaTypes()
    {
        if (!IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Admin.Forbidden"]
            });
        }

        var visaTypes = await _context.VisaTypes
            .Include(vt => vt.PricingRules)
                .ThenInclude(pr => pr.Package)
            .OrderBy(vt => vt.Code)
            .ToListAsync().ConfigureAwait(false);

        var response = visaTypes.Select(vt => new AdminVisaTypesResponse
        {
            Id = vt.Id,
            Code = vt.Code,
            Name = vt.Name,
            IsActive = vt.IsActive,
            CreatedAt = vt.CreatedAt,
            UpdatedAt = vt.UpdatedAt,
            PricingRules = vt.PricingRules
                .GroupBy(pr => pr.CountryCode)
                .OrderBy(g => g.Key)
                .Select(countryGroup => new AdminPricingRuleGroup
                {
                    CountryCode = countryGroup.Key,
                    Rules = countryGroup
                        .OrderBy(pr => pr.Package?.SortOrder ?? int.MaxValue)
                        .Select(pr => new AdminPricingRuleResponse
                        {
                            Id = pr.Id,
                            PackageId = pr.PackageId,
                            PackageCode = pr.Package?.Code ?? string.Empty,
                            PackageDisplayName = pr.Package?.DisplayName ?? string.Empty,
                            BasePrice = pr.BasePrice,
                            Currency = pr.Currency,
                            TaxRate = pr.TaxRate,
                            FxSurchargeMode = pr.FxSurchargeMode,
                            IsActive = pr.IsActive,
                            CreatedAt = pr.CreatedAt,
                            UpdatedAt = pr.UpdatedAt
                        }).ToArray()
                }).ToArray()
        }).ToArray();

        // Audit log
        await LogAuditAsync("admin", "pricing_view", "VisaType", "multiple", 
            new { visaTypeCount = visaTypes.Count }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Update visa type and its pricing rules
    /// </summary>
    /// <param name="id">Visa type ID</param>
    /// <param name="request">Update request</param>
    /// <returns>Success message</returns>
    [HttpPatch("pricing/visa-types/{id}")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<MessageResponse>> UpdateVisaTypePricing(
        int id, 
        [FromBody] UpdateVisaTypePricingRequest request)
    {
        if (!IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Admin.Forbidden"]
            });
        }

        var visaType = await _context.VisaTypes
            .Include(vt => vt.PricingRules)
            .FirstOrDefaultAsync(vt => vt.Id == id).ConfigureAwait(false);

        if (visaType == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Visa Type Not Found",
                Detail = _localizer["Admin.VisaTypeNotFound"]
            });
        }

        var changes = new List<object>();

        // Update visa type IsActive if provided
        if (request.IsActive.HasValue && visaType.IsActive != request.IsActive.Value)
        {
            var oldValue = visaType.IsActive;
            visaType.IsActive = request.IsActive.Value;
            visaType.UpdatedAt = DateTime.UtcNow;
            changes.Add(new { field = "IsActive", oldValue, newValue = request.IsActive.Value });
        }

        // Update pricing rules if provided
        if (request.PricingRuleUpdates != null)
        {
            foreach (var ruleUpdate in request.PricingRuleUpdates)
            {
                var pricingRule = visaType.PricingRules
                    .FirstOrDefault(pr => pr.Id == ruleUpdate.Id);

                if (pricingRule == null) continue;

                var ruleChanges = new List<object>();

                if (ruleUpdate.BasePrice.HasValue && pricingRule.BasePrice != ruleUpdate.BasePrice.Value)
                {
                    ruleChanges.Add(new { field = "BasePrice", oldValue = pricingRule.BasePrice, newValue = ruleUpdate.BasePrice.Value });
                    pricingRule.BasePrice = ruleUpdate.BasePrice.Value;
                    pricingRule.UpdatedAt = DateTime.UtcNow;
                }

                if (ruleUpdate.TaxRate.HasValue && pricingRule.TaxRate != ruleUpdate.TaxRate.Value)
                {
                    ruleChanges.Add(new { field = "TaxRate", oldValue = pricingRule.TaxRate, newValue = ruleUpdate.TaxRate.Value });
                    pricingRule.TaxRate = ruleUpdate.TaxRate.Value;
                    pricingRule.UpdatedAt = DateTime.UtcNow;
                }

                if (ruleUpdate.IsActive.HasValue && pricingRule.IsActive != ruleUpdate.IsActive.Value)
                {
                    ruleChanges.Add(new { field = "IsActive", oldValue = pricingRule.IsActive, newValue = ruleUpdate.IsActive.Value });
                    pricingRule.IsActive = ruleUpdate.IsActive.Value;
                    pricingRule.UpdatedAt = DateTime.UtcNow;
                }

                if (ruleChanges.Any())
                {
                    changes.Add(new { pricingRuleId = ruleUpdate.Id, changes = ruleChanges });
                }
            }
        }

        if (changes.Any())
        {
            await _context.SaveChangesAsync().ConfigureAwait(false);

            // Audit log
            await LogAuditAsync("admin", "pricing_update", "VisaType", id.ToString(CultureInfo.InvariantCulture), 
                new { changes }).ConfigureAwait(false);
        }

        return Ok(new MessageResponse
        {
            Message = _localizer["Admin.PricingUpdated"]
        });
    }

    /// <summary>
    /// Get all packages for admin management
    /// </summary>
    /// <returns>All packages</returns>
    [HttpGet("pricing/packages")]
    [ProducesResponseType(typeof(AdminPackageResponse[]), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminPackageResponse[]>> GetAdminPackages()
    {
        if (!IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Admin.Forbidden"]
            });
        }

        var packages = await _context.Packages
            .OrderBy(p => p.SortOrder)
            .ToListAsync().ConfigureAwait(false);

        var response = packages.Select(p => new AdminPackageResponse
        {
            Id = p.Id,
            Code = p.Code,
            DisplayName = p.DisplayName,
            Description = p.Description,
            SortOrder = p.SortOrder,
            IsActive = p.IsActive,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        }).ToArray();

        // Audit log
        await LogAuditAsync("admin", "packages_view", "Package", "multiple", 
            new { packageCount = packages.Count }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Get all users for admin management
    /// </summary>
    /// <returns>All users with their basic information</returns>
    [HttpGet("users")]
    [ProducesResponseType(typeof(AdminUserResponse[]), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminUserResponse[]>> GetAdminUsers()
    {
        if (!IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Admin.Forbidden"]
            });
        }

        var users = await _context.Users
            .OrderBy(u => u.CreatedAt)
            .ToListAsync().ConfigureAwait(false);

        var response = users.Select(u => new AdminUserResponse
        {
            Id = u.Id.ToString(),
            Email = u.Email,
            FirstName = u.FirstName,
            LastName = u.LastName,
            IsAdmin = u.IsAdmin,
            IsStaff = u.IsStaff,
            EmailVerified = u.EmailVerified,
            CreatedAt = u.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture)
        }).ToArray();

        // Audit log
        await LogAuditAsync("admin", "users_view", "User", "multiple", 
            new { userCount = users.Count }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Update user roles
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="request">Role update request</param>
    /// <returns>Success message</returns>
    [HttpPut("users/{id}/roles")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<MessageResponse>> UpdateUserRoles(
        string id, 
        [FromBody] UpdateUserRolesRequest request)
    {
        if (!IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Admin.Forbidden"]
            });
        }

        if (!Guid.TryParse(id, out var userId))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid User ID",
                Detail = "User ID must be a valid GUID"
            });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == new UserId(userId))
            .ConfigureAwait(false);

        if (user == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "User Not Found",
                Detail = _localizer["Admin.UserNotFound"]
            });
        }

        var changes = new List<object>();

        if (user.IsAdmin != request.IsAdmin)
        {
            changes.Add(new { field = "IsAdmin", oldValue = user.IsAdmin, newValue = request.IsAdmin });
            user.IsAdmin = request.IsAdmin;
        }

        if (user.IsStaff != request.IsStaff)
        {
            changes.Add(new { field = "IsStaff", oldValue = user.IsStaff, newValue = request.IsStaff });
            user.IsStaff = request.IsStaff;
        }

        if (changes.Any())
        {
            await _context.SaveChangesAsync().ConfigureAwait(false);

            // Audit log
            await LogAuditAsync("admin", "user_roles_update", "User", id, 
                new { changes }).ConfigureAwait(false);
        }

        return Ok(new MessageResponse
        {
            Message = _localizer["Admin.UserRolesUpdated"]
        });
    }

    /// <summary>
    /// Get comprehensive platform analytics and reports
    /// </summary>
    /// <returns>Platform analytics dashboard data</returns>
    [HttpGet("analytics/dashboard")]
    [ProducesResponseType(typeof(AdminAnalyticsDashboardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminAnalyticsDashboardResponse>> GetAnalyticsDashboard()
    {
        if (!IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Admin.Forbidden"]
            });
        }

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);
        var startOfYear = new DateTime(now.Year, 1, 1);
        var thirtyDaysAgo = now.AddDays(-30);
        var sevenDaysAgo = now.AddDays(-7);

        // Core metrics
        var totalUsers = await _context.Users.CountAsync().ConfigureAwait(false);
        var totalCases = await _context.Cases.CountAsync().ConfigureAwait(false);
        var activeCases = await _context.Cases.CountAsync(c => c.Status == "active").ConfigureAwait(false);
        var totalRevenue = await _context.Invoices
            .Where(i => i.Status == "paid")
            .SumAsync(i => i.Total).ConfigureAwait(false);

        // Growth metrics
        var newUsersThisMonth = await _context.Users
            .CountAsync(u => u.CreatedAt >= startOfMonth).ConfigureAwait(false);
        var newCasesThisMonth = await _context.Cases
            .CountAsync(c => c.CreatedAt >= startOfMonth).ConfigureAwait(false);
        var revenueThisMonth = await _context.Invoices
            .Where(i => i.Status == "paid" && i.CreatedAt >= startOfMonth)
            .SumAsync(i => i.Total).ConfigureAwait(false);

        // Case status distribution
        var caseStatusCounts = await _context.Cases
            .GroupBy(c => c.Status)
            .Select(g => new AdminStatusCountResponse
            {
                Status = g.Key,
                Count = g.Count()
            })
            .ToListAsync().ConfigureAwait(false);

        // Popular visa types
        var popularVisaTypes = await _context.Cases
            .Include(c => c.VisaType)
            .Where(c => c.VisaType != null)
            .GroupBy(c => new { c.VisaType!.Code, c.VisaType.Name })
            .Select(g => new AdminVisaTypeStatsResponse
            {
                VisaTypeCode = g.Key.Code,
                VisaTypeName = g.Key.Name,
                CaseCount = g.Count()
            })
            .OrderByDescending(v => v.CaseCount)
            .Take(10)
            .ToListAsync().ConfigureAwait(false);

        // Recent activity metrics
        var recentUserRegistrations = await _context.Users
            .CountAsync(u => u.CreatedAt >= sevenDaysAgo).ConfigureAwait(false);
        var recentCaseActivity = await _context.Cases
            .CountAsync(c => c.LastActivityAt >= sevenDaysAgo).ConfigureAwait(false);

        // Payment analytics
        var totalInvoices = await _context.Invoices.CountAsync().ConfigureAwait(false);
        var paidInvoices = await _context.Invoices.CountAsync(i => i.Status == "paid").ConfigureAwait(false);
        var pendingInvoices = await _context.Invoices.CountAsync(i => i.Status == "draft").ConfigureAwait(false);

        var response = new AdminAnalyticsDashboardResponse
        {
            // Core metrics
            TotalUsers = totalUsers,
            TotalCases = totalCases,
            ActiveCases = activeCases,
            TotalRevenue = totalRevenue,

            // Growth metrics
            NewUsersThisMonth = newUsersThisMonth,
            NewCasesThisMonth = newCasesThisMonth,
            RevenueThisMonth = revenueThisMonth,

            // Activity metrics
            RecentUserRegistrations = recentUserRegistrations,
            RecentCaseActivity = recentCaseActivity,

            // Payment metrics
            TotalInvoices = totalInvoices,
            PaidInvoices = paidInvoices,
            PendingInvoices = pendingInvoices,
            PaymentSuccessRate = totalInvoices > 0 ? Math.Round((decimal)paidInvoices / totalInvoices * 100, 2) : 0,

            // Distributions
            CaseStatusCounts = caseStatusCounts,
            PopularVisaTypes = popularVisaTypes,

            // Metadata
            GeneratedAt = now
        };

        // Audit log
        await LogAuditAsync("admin", "analytics_dashboard_view", "Analytics", "dashboard", 
            new { timestamp = now }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Get detailed financial analytics and revenue reports
    /// </summary>
    /// <param name="startDate">Start date for the report (optional)</param>
    /// <param name="endDate">End date for the report (optional)</param>
    /// <returns>Financial analytics data</returns>
    [HttpGet("analytics/financial")]
    [ProducesResponseType(typeof(AdminFinancialAnalyticsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminFinancialAnalyticsResponse>> GetFinancialAnalytics(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        if (!IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Admin.Forbidden"]
            });
        }

        var now = DateTime.UtcNow;
        var start = startDate ?? now.AddDays(-90); // Default to last 90 days
        var end = endDate ?? now;

        // Revenue analytics
        var totalRevenue = await _context.Invoices
            .Where(i => i.Status == "paid" && i.CreatedAt >= start && i.CreatedAt <= end)
            .SumAsync(i => i.Total).ConfigureAwait(false);

        var totalInvoices = await _context.Invoices
            .CountAsync(i => i.CreatedAt >= start && i.CreatedAt <= end).ConfigureAwait(false);

        var paidInvoices = await _context.Invoices
            .CountAsync(i => i.Status == "paid" && i.CreatedAt >= start && i.CreatedAt <= end).ConfigureAwait(false);

        // Revenue by visa type
        var revenueByVisaType = await _context.Invoices
            .Include(i => i.Case)
                .ThenInclude(c => c.VisaType)
            .Where(i => i.Status == "paid" && i.CreatedAt >= start && i.CreatedAt <= end && i.Case.VisaType != null)
            .GroupBy(i => new { i.Case.VisaType!.Code, i.Case.VisaType.Name })
            .Select(g => new AdminRevenueByTypeResponse
            {
                VisaTypeCode = g.Key.Code,
                VisaTypeName = g.Key.Name,
                Revenue = g.Sum(i => i.Total),
                Count = g.Count()
            })
            .OrderByDescending(r => r.Revenue)
            .ToListAsync().ConfigureAwait(false);

        // Monthly revenue trend
        var monthlyRevenue = await _context.Invoices
            .Where(i => i.Status == "paid" && i.CreatedAt >= start && i.CreatedAt <= end)
            .GroupBy(i => new { Year = i.CreatedAt.Year, Month = i.CreatedAt.Month })
            .Select(g => new AdminMonthlyRevenueResponse
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Revenue = g.Sum(i => i.Total),
                InvoiceCount = g.Count()
            })
            .OrderBy(r => r.Year)
            .ThenBy(r => r.Month)
            .ToListAsync().ConfigureAwait(false);

        var response = new AdminFinancialAnalyticsResponse
        {
            StartDate = start,
            EndDate = end,
            TotalRevenue = totalRevenue,
            TotalInvoices = totalInvoices,
            PaidInvoices = paidInvoices,
            PaymentSuccessRate = totalInvoices > 0 ? Math.Round((decimal)paidInvoices / totalInvoices * 100, 2) : 0,
            AverageInvoiceAmount = paidInvoices > 0 ? Math.Round(totalRevenue / paidInvoices, 2) : 0,
            RevenueByVisaType = revenueByVisaType,
            MonthlyRevenue = monthlyRevenue,
            GeneratedAt = DateTime.UtcNow
        };

        // Audit log
        await LogAuditAsync("admin", "financial_analytics_view", "Analytics", "financial",
            new { start, end, revenue = totalRevenue }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Get user activity and engagement analytics
    /// </summary>
    /// <returns>User activity analytics data</returns>
    [HttpGet("analytics/users")]
    [ProducesResponseType(typeof(AdminUserAnalyticsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminUserAnalyticsResponse>> GetUserAnalytics()
    {
        if (!IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Admin.Forbidden"]
            });
        }

        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);
        var sevenDaysAgo = now.AddDays(-7);

        // User registration trends
        var userRegistrationTrend = await _context.Users
            .Where(u => u.CreatedAt >= thirtyDaysAgo)
            .GroupBy(u => u.CreatedAt.Date)
            .Select(g => new AdminDailyCountResponse
            {
                Date = g.Key,
                Count = g.Count()
            })
            .OrderBy(r => r.Date)
            .ToListAsync().ConfigureAwait(false);

        // User demographics
        var usersByCountry = await _context.Users
            .GroupBy(u => u.Country)
            .Select(g => new AdminCountryStatsResponse
            {
                Country = g.Key,
                UserCount = g.Count()
            })
            .OrderByDescending(c => c.UserCount)
            .Take(10)
            .ToListAsync().ConfigureAwait(false);

        // Activity metrics
        var totalUsers = await _context.Users.CountAsync().ConfigureAwait(false);
        var activeUsers7Days = await _context.AuditLogs
            .Where(a => a.ActorUserId != null && a.CreatedAt >= sevenDaysAgo)
            .Select(a => a.ActorUserId)
            .Distinct()
            .CountAsync().ConfigureAwait(false);

        var activeUsers30Days = await _context.AuditLogs
            .Where(a => a.ActorUserId != null && a.CreatedAt >= thirtyDaysAgo)
            .Select(a => a.ActorUserId)
            .Distinct()
            .CountAsync().ConfigureAwait(false);

        var response = new AdminUserAnalyticsResponse
        {
            TotalUsers = totalUsers,
            ActiveUsers7Days = activeUsers7Days,
            ActiveUsers30Days = activeUsers30Days,
            UserEngagementRate7Days = totalUsers > 0 ? Math.Round((decimal)activeUsers7Days / totalUsers * 100, 2) : 0,
            UserEngagementRate30Days = totalUsers > 0 ? Math.Round((decimal)activeUsers30Days / totalUsers * 100, 2) : 0,
            RegistrationTrend = userRegistrationTrend,
            UsersByCountry = usersByCountry,
            GeneratedAt = now
        };

        // Audit log
        await LogAuditAsync("admin", "user_analytics_view", "Analytics", "users",
            new { totalUsers, activeUsers7Days, activeUsers30Days }).ConfigureAwait(false);

        return Ok(response);
    }

    private bool IsAdmin()
    {
        return User.HasClaim("is_admin", "True") || User.HasClaim("is_admin", "true") || User.IsInRole("Admin");
    }

    private UserId GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return new UserId(userId);
        }
        throw new UnauthorizedAccessException("User ID not found in claims");
    }

    /// <summary>
    /// Get all cases for admin management
    /// </summary>
    /// <returns>All cases with their information</returns>
    [HttpGet("cases")]
    [ProducesResponseType(typeof(AdminCaseResponse[]), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminCaseResponse[]>> GetAdminCases()
    {
        if (!IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Admin.Forbidden"]
            });
        }

        var cases = await _context.Cases
            .Include(c => c.User)
            .Include(c => c.VisaType)
            .Include(c => c.Package)
            .Include(c => c.PriceSnapshots.OrderByDescending(p => p.CreatedAt))
            .OrderByDescending(c => c.LastActivityAt)
            .ToListAsync().ConfigureAwait(false);

        var response = cases.Select(c => new AdminCaseResponse
        {
            Id = c.Id.Value.ToString(),
            Status = c.Status,
            LastActivityAt = c.LastActivityAt.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture),
            CreatedAt = c.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture),
            UserEmail = c.User.Email,
            UserName = $"{c.User.FirstName} {c.User.LastName}".Trim(),
            VisaTypeCode = c.VisaType?.Code,
            VisaTypeName = c.VisaType?.Name,
            PackageCode = c.Package?.Code,
            PackageDisplayName = c.Package?.DisplayName,
            LatestPriceSnapshot = c.PriceSnapshots.FirstOrDefault() != null 
                ? new AdminPriceSnapshotResponse
                {
                    Id = c.PriceSnapshots.First().Id,
                    VisaTypeCode = c.PriceSnapshots.First().VisaTypeCode,
                    PackageCode = c.PriceSnapshots.First().PackageCode,
                    CountryCode = c.PriceSnapshots.First().CountryCode,
                    Total = c.PriceSnapshots.First().Total,
                    Currency = c.PriceSnapshots.First().Currency,
                    CreatedAt = c.PriceSnapshots.First().CreatedAt.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture)
                }
                : null
        }).ToArray();

        // Audit log
        await LogAuditAsync("admin", "cases_view", "Case", "multiple", 
            new { caseCount = cases.Count }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Update case status for admin management
    /// </summary>
    /// <param name="id">Case ID</param>
    /// <param name="request">Status update request</param>
    /// <returns>Success message</returns>
    [HttpPatch("cases/{id}/status")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<MessageResponse>> UpdateAdminCaseStatus(
        string id, 
        [FromBody] AdminUpdateCaseStatusRequest request)
    {
        if (!IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Admin.Forbidden"]
            });
        }

        if (!Guid.TryParse(id, out var caseGuid))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Case ID",
                Detail = "Case ID must be a valid GUID"
            });
        }

        var caseId = new CaseId(caseGuid);
        var caseEntity = await _context.Cases
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == caseId)
            .ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Case Not Found",
                Detail = _localizer["Admin.CaseNotFound"]
            });
        }

        var oldStatus = caseEntity.Status;
        caseEntity.Status = request.Status;
        caseEntity.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Audit log
        await LogAuditAsync("admin", "case_status_update", "Case", id, 
            new { 
                oldStatus, 
                newStatus = request.Status, 
                userEmail = caseEntity.User.Email,
                reason = request.Reason 
            }).ConfigureAwait(false);

        return Ok(new MessageResponse
        {
            Message = _localizer["Admin.CaseStatusUpdated"]
        });
    }

    private async Task LogAuditAsync(string category, string action, string targetType, string targetId, object details)
    {
        var userId = GetCurrentUserId();
        var auditLog = new AuditLog
        {
            Category = category,
            ActorUserId = userId,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            DetailsJson = JsonSerializer.Serialize(details),
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync().ConfigureAwait(false);
    }
}

// DTOs
public class AdminVisaTypesResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public AdminPricingRuleGroup[] PricingRules { get; set; } = Array.Empty<AdminPricingRuleGroup>();
}

public class AdminPricingRuleGroup
{
    public string CountryCode { get; set; } = string.Empty;
    public AdminPricingRuleResponse[] Rules { get; set; } = Array.Empty<AdminPricingRuleResponse>();
}

public class AdminPricingRuleResponse
{
    public int Id { get; set; }
    public int PackageId { get; set; }
    public string PackageCode { get; set; } = string.Empty;
    public string PackageDisplayName { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal TaxRate { get; set; }
    public string? FxSurchargeMode { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AdminPackageResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateVisaTypePricingRequest
{
    public bool? IsActive { get; set; }
    public PricingRuleUpdateRequest[]? PricingRuleUpdates { get; set; }
}

public class PricingRuleUpdateRequest
{
    public int Id { get; set; }
    public decimal? BasePrice { get; set; }
    public decimal? TaxRate { get; set; }
    public bool? IsActive { get; set; }
}

public class AdminUserResponse
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
    public bool IsStaff { get; set; }
    public bool EmailVerified { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class UpdateUserRolesRequest
{
    public bool IsAdmin { get; set; }
    public bool IsStaff { get; set; }
}

public class AdminCaseResponse
{
    public string Id { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string LastActivityAt { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? VisaTypeCode { get; set; }
    public string? VisaTypeName { get; set; }
    public string? PackageCode { get; set; }
    public string? PackageDisplayName { get; set; }
    public AdminPriceSnapshotResponse? LatestPriceSnapshot { get; set; }
}

public class AdminPriceSnapshotResponse
{
    public int Id { get; set; }
    public string VisaTypeCode { get; set; } = string.Empty;
    public string PackageCode { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

public class AdminUpdateCaseStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
}

// Analytics Response Models
public class AdminAnalyticsDashboardResponse
{
    // Core metrics
    public int TotalUsers { get; set; }
    public int TotalCases { get; set; }
    public int ActiveCases { get; set; }
    public decimal TotalRevenue { get; set; }

    // Growth metrics
    public int NewUsersThisMonth { get; set; }
    public int NewCasesThisMonth { get; set; }
    public decimal RevenueThisMonth { get; set; }

    // Activity metrics
    public int RecentUserRegistrations { get; set; }
    public int RecentCaseActivity { get; set; }

    // Payment metrics
    public int TotalInvoices { get; set; }
    public int PaidInvoices { get; set; }
    public int PendingInvoices { get; set; }
    public decimal PaymentSuccessRate { get; set; }

    // Distributions
    public List<AdminStatusCountResponse> CaseStatusCounts { get; set; } = new();
    public List<AdminVisaTypeStatsResponse> PopularVisaTypes { get; set; } = new();

    // Metadata
    public DateTime GeneratedAt { get; set; }
}

public class AdminFinancialAnalyticsResponse
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalInvoices { get; set; }
    public int PaidInvoices { get; set; }
    public decimal PaymentSuccessRate { get; set; }
    public decimal AverageInvoiceAmount { get; set; }
    public List<AdminRevenueByTypeResponse> RevenueByVisaType { get; set; } = new();
    public List<AdminMonthlyRevenueResponse> MonthlyRevenue { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}

public class AdminUserAnalyticsResponse
{
    public int TotalUsers { get; set; }
    public int ActiveUsers7Days { get; set; }
    public int ActiveUsers30Days { get; set; }
    public decimal UserEngagementRate7Days { get; set; }
    public decimal UserEngagementRate30Days { get; set; }
    public List<AdminDailyCountResponse> RegistrationTrend { get; set; } = new();
    public List<AdminCountryStatsResponse> UsersByCountry { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}

public class AdminStatusCountResponse
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class AdminVisaTypeStatsResponse
{
    public string VisaTypeCode { get; set; } = string.Empty;
    public string VisaTypeName { get; set; } = string.Empty;
    public int CaseCount { get; set; }
}

public class AdminRevenueByTypeResponse
{
    public string VisaTypeCode { get; set; } = string.Empty;
    public string VisaTypeName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Count { get; set; }
}

public class AdminMonthlyRevenueResponse
{
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal Revenue { get; set; }
    public int InvoiceCount { get; set; }
}

public class AdminDailyCountResponse
{
    public DateTime Date { get; set; }
    public int Count { get; set; }
}

public class AdminCountryStatsResponse
{
    public string Country { get; set; } = string.Empty;
    public int UserCount { get; set; }
}