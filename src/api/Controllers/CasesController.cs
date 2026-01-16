using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Security.Claims;
using System.Text.Json;
using System.Globalization;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/cases")]
[Authorize]
[Tags("Cases")]
public class CasesController : ControllerBase
{
    private readonly L4HDbContext _context;

    public CasesController(L4HDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get the current user's cases (default endpoint)
    /// </summary>
    /// <returns>List of user's cases</returns>
    [HttpGet]
    [ProducesResponseType(typeof(CaseResponse[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<CaseResponse[]>> GetCases()
    {
        return await GetMyCases().ConfigureAwait(false);
    }

    /// <summary>
    /// Get cases for dashboard view (legal professionals see their assigned cases, admins can filter)
    /// </summary>
    /// <param name="showAssigned">For admins: true to show assigned cases, false for unassigned (default)</param>
    /// <param name="search">Search by client first or last name</param>
    /// <param name="sortBy">Field to sort by (default: lastActivityAt)</param>
    /// <param name="sortDesc">Sort in descending order (default: true)</param>
    /// <returns>List of cases for dashboard</returns>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(CaseDashboardResponse[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<CaseDashboardResponse[]>> GetDashboardCases(
        [FromQuery] bool? showAssigned = false,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = "lastActivityAt",
        [FromQuery] bool sortDesc = true)
    {
        var userId = GetCurrentUserId();
        var isAdmin = IsAdmin();
        var isLegalProfessional = IsLegalProfessional();

        IQueryable<Case> query = _context.Cases
            .Include(c => c.User)
            .Include(c => c.CaseVisaTypes)
                .ThenInclude(cvt => cvt.VisaType)
            .AsQueryable();

        // Filter by assignment based on user role
        if (isAdmin)
        {
            // Admins can toggle between assigned and unassigned cases
            if (showAssigned == true)
            {
                query = query.Where(c => c.AssignedStaffId != null);
            }
            else
            {
                query = query.Where(c => c.AssignedStaffId == null);
            }
        }
        else if (isLegalProfessional)
        {
            // Legal professionals only see cases assigned to them
            var currentUser = await _context.Users.FindAsync(userId);
            if (currentUser?.AttorneyId != null)
            {
                query = query.Where(c => c.AssignedStaffId == currentUser.AttorneyId);
            }
            else
            {
                // No attorney profile, return empty list
                return Ok(Array.Empty<CaseDashboardResponse>());
            }
        }
        else
        {
            // Regular users shouldn't access this endpoint
            return Forbid();
        }

        // Search by client name
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower(CultureInfo.InvariantCulture);
            query = query.Where(c =>
                (c.User.FirstName != null && c.User.FirstName.ToLower(CultureInfo.InvariantCulture).Contains(searchLower)) ||
                (c.User.LastName != null && c.User.LastName.ToLower(CultureInfo.InvariantCulture).Contains(searchLower)));
        }

        // Apply sorting
        query = sortBy?.ToLower(CultureInfo.InvariantCulture) switch
        {
            "firstname" => sortDesc
                ? query.OrderByDescending(c => c.User.FirstName)
                : query.OrderBy(c => c.User.FirstName),
            "lastname" => sortDesc
                ? query.OrderByDescending(c => c.User.LastName)
                : query.OrderBy(c => c.User.LastName),
            "status" => sortDesc
                ? query.OrderByDescending(c => c.Status)
                : query.OrderBy(c => c.Status),
            "createdat" => sortDesc
                ? query.OrderByDescending(c => c.CreatedAt)
                : query.OrderBy(c => c.CreatedAt),
            _ => sortDesc
                ? query.OrderByDescending(c => c.LastActivityAt)
                : query.OrderBy(c => c.LastActivityAt)
        };

        var cases = await query.ToListAsync().ConfigureAwait(false);

        // Get assigned staff details for cases that have assignments
        var staffIds = cases.Where(c => c.AssignedStaffId.HasValue).Select(c => c.AssignedStaffId!.Value).Distinct().ToList();
        var staffMembers = await _context.Attorneys
            .Where(a => staffIds.Contains(a.Id))
            .Select(a => new { a.Id, a.Name })
            .ToDictionaryAsync(a => a.Id, a => a.Name);

        var response = cases.Select(c => new CaseDashboardResponse
        {
            Id = c.Id.Value,
            ClientId = _context.Clients.Where(cl => cl.Email == c.User.Email).Select(cl => (int?)cl.Id).FirstOrDefault(),
            ClientFirstName = c.User.FirstName ?? "",
            ClientLastName = c.User.LastName ?? "",
            ClientEmail = c.User.Email,
            Status = c.Status,
            LastActivityAt = c.LastActivityAt,
            CreatedAt = c.CreatedAt,
            AssignedStaffId = c.AssignedStaffId,
            AssignedStaffName = c.AssignedStaffId.HasValue && staffMembers.ContainsKey(c.AssignedStaffId.Value)
                ? staffMembers[c.AssignedStaffId.Value]
                : null,
            VisaTypes = c.CaseVisaTypes
                .OrderBy(cvt => cvt.DisplayOrder)
                .Select(cvt => new CaseVisaTypeInfo
                {
                    VisaTypeId = cvt.VisaTypeId,
                    VisaTypeCode = cvt.VisaType.Code ?? "",
                    VisaTypeName = cvt.VisaType.Name ?? "",
                    IsPrimary = cvt.IsPrimary,
                    DisplayOrder = cvt.DisplayOrder
                })
                .ToList()
        }).ToArray();

        await LogAuditAsync("case", "dashboard_list", "Case", "multiple",
            new { count = response.Length, showAssigned, isAdmin, isLegalProfessional }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Get the current user's cases
    /// </summary>
    /// <returns>List of user's cases</returns>
    [HttpGet("mine")]
    [ProducesResponseType(typeof(CaseResponse[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<CaseResponse[]>> GetMyCases()
    {
        var userId = GetCurrentUserId();
        
        var cases = await _context.Cases
            .Include(c => c.VisaType)
            .Include(c => c.Package)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.LastActivityAt)
            .ToListAsync().ConfigureAwait(false);

        var response = cases.Select(c => new CaseResponse
        {
            Id = c.Id.Value,
            Status = c.Status,
            LastActivityAt = c.LastActivityAt,
            VisaTypeCode = c.VisaType?.Code,
            VisaTypeName = c.VisaType?.Name,
            PackageCode = c.Package?.Code,
            PackageDisplayName = c.Package?.DisplayName,
            CreatedAt = c.CreatedAt
        }).ToArray();

        // Audit log for case access
        await LogAuditAsync("case", "list_mine", "Case", "multiple", new { count = cases.Count }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Get a specific case by ID
    /// </summary>
    /// <param name="id">Case ID</param>
    /// <returns>Case details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(CaseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CaseResponse>> GetCase(Guid id)
    {
        var caseId = new CaseId(id);
        var userId = GetCurrentUserId();
        var isAdmin = IsAdmin();

        var caseEntity = await _context.Cases
            .Include(c => c.VisaType)
            .Include(c => c.Package)
            .Include(c => c.PriceSnapshots.OrderByDescending(p => p.CreatedAt))
            .FirstOrDefaultAsync(c => c.Id == caseId).ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Not Found",
                Detail = "Case not found."
            });
        }

        // Check access: owner or admin
        if (caseEntity.UserId != userId && !isAdmin)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = "Access denied."
            });
        }

        var response = new CaseResponse
        {
            Id = caseEntity.Id.Value,
            Status = caseEntity.Status,
            LastActivityAt = caseEntity.LastActivityAt,
            VisaTypeCode = caseEntity.VisaType?.Code,
            VisaTypeName = caseEntity.VisaType?.Name,
            PackageCode = caseEntity.Package?.Code,
            PackageDisplayName = caseEntity.Package?.DisplayName,
            CreatedAt = caseEntity.CreatedAt,
            LatestPriceSnapshot = caseEntity.PriceSnapshots.FirstOrDefault() != null 
                ? new PriceSnapshotResponse
                {
                    Id = caseEntity.PriceSnapshots.First().Id,
                    VisaTypeCode = caseEntity.PriceSnapshots.First().VisaTypeCode,
                    PackageCode = caseEntity.PriceSnapshots.First().PackageCode,
                    CountryCode = caseEntity.PriceSnapshots.First().CountryCode,
                    Total = caseEntity.PriceSnapshots.First().Total,
                    Currency = caseEntity.PriceSnapshots.First().Currency,
                    CreatedAt = caseEntity.PriceSnapshots.First().CreatedAt
                }
                : null
        };

        // Audit log for case access
        await LogAuditAsync("case", "view", "Case", id.ToString(), new { status = caseEntity.Status }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Set the package for a case
    /// </summary>
    /// <param name="id">Case ID</param>
    /// <param name="request">Package selection</param>
    /// <returns>Success message</returns>
    [HttpPost("{id}/package")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SetPackage(Guid id, [FromBody] SetPackageRequest request)
    {
        var caseId = new CaseId(id);
        var userId = GetCurrentUserId();

        var caseEntity = await _context.Cases
            .FirstOrDefaultAsync(c => c.Id == caseId).ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails { Title = "Not Found", Detail = "Case not found." });
        }

        if (caseEntity.UserId != userId && !IsAdmin())
        {
            return StatusCode(403, new ProblemDetails { Title = "Forbidden", Detail = "Access denied." });
        }

        // Try to parse ID, otherwise treat as code
        int? packageIdInt = null;
        if (int.TryParse(request.PackageId, out var pid)) packageIdInt = pid;

        var package = await _context.Packages
            .FirstOrDefaultAsync(p => (packageIdInt.HasValue && p.Id == packageIdInt.Value) || p.Code == request.PackageId)
            .ConfigureAwait(false);

        if (package == null)
        {
             return NotFound(new ProblemDetails { Title = "Not Found", Detail = "Package not found." });
        }

        caseEntity.PackageId = package.Id;
        caseEntity.LastActivityAt = DateTimeOffset.UtcNow;
        
        // Update status if needed (e.g. from Inactive to Pending)
        if (caseEntity.Status == "inactive") caseEntity.Status = "pending";

        await _context.SaveChangesAsync().ConfigureAwait(false);
        
        await LogAuditAsync("case", "set_package", "Case", id.ToString(), new { packageId = package.Id }).ConfigureAwait(false);

        return Ok(new { message = "Package updated successfully." });
    }

    /// <summary>
    /// Update case status (POST alternative for CORS compatibility)
    /// </summary>
    /// <param name="id">Case ID</param>
    /// <param name="request">Status update request</param>
    /// <returns>Success message</returns>
    [HttpPost("{id}/status")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<MessageResponse>> UpdateCaseStatusPost(Guid id, [FromBody] UpdateCaseStatusRequest request)
    {
        return await UpdateCaseStatus(id, request);
    }

    /// <summary>
    /// Update case status with guarded transitions
    /// </summary>
    /// <param name="id">Case ID</param>
    /// <param name="request">Status update request</param>
    /// <returns>Success message</returns>
    [HttpPatch("{id}/status")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<MessageResponse>> UpdateCaseStatus(Guid id, [FromBody] UpdateCaseStatusRequest request)
    {
        var caseId = new CaseId(id);
        var userId = GetCurrentUserId();
        var isAdmin = IsAdmin();

        var caseEntity = await _context.Cases.FirstOrDefaultAsync(c => c.Id == caseId).ConfigureAwait(false);
        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Not Found",
                Detail = "Case not found."
            });
        }

        // Check access: owner or admin
        if (caseEntity.UserId != userId && !isAdmin)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = "Access denied."
            });
        }

        // Validate transition
        if (!isAdmin && !IsValidTransition(caseEntity.Status, request.Status))
        {
            return StatusCode(409, new ProblemDetails
            {
                Title = "Invalid Transition",
                Detail = "Invalid status transition."
            });
        }

        var oldStatus = caseEntity.Status;
        caseEntity.Status = request.Status;
        caseEntity.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Audit log for status change
        await LogAuditAsync("case", "status_change", "Case", id.ToString(), 
            new { oldStatus, newStatus = request.Status }).ConfigureAwait(false);

        return Ok(new MessageResponse
        {
            Message = "Status updated successfully."
        });
    }

    // ... (rest of the file)

    /// <summary>
    /// Assign a case to a legal professional (admin only)
    /// </summary>
    /// <param name="id">Case ID</param>
    /// <param name="request">Assignment request</param>
    /// <returns>Success response</returns>
    [HttpPost("{id}/assign")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignCase(Guid id, [FromBody] AssignCaseRequest request)
    {
        var caseId = new CaseId(id);

        var caseEntity = await _context.Cases
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == caseId)
            .ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails { Title = "Not Found", Detail = "Case not found." });
        }

        // Verify the attorney exists
        var attorney = await _context.Attorneys.FindAsync(request.StaffId);
        if (attorney == null)
        {
            // Debugging: Log available attorneys
            var count = await _context.Attorneys.CountAsync();
            var firstId = await _context.Attorneys.Select(a => a.Id).FirstOrDefaultAsync();
            return NotFound(new ProblemDetails 
            { 
                Title = "Not Found", 
                Detail = $"Attorney/Staff not found. ID requested: {request.StaffId}. Total attorneys in DB: {count}. First ID: {firstId}." 
            });
        }

        var previousStaffId = caseEntity.AssignedStaffId;
        caseEntity.AssignedStaffId = request.StaffId;
        caseEntity.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Send notification to the assigned attorney if they have notifications enabled
        var assignedUser = await _context.Users.FirstOrDefaultAsync(u => u.AttorneyId == request.StaffId);
        if (assignedUser != null)
        {
            var notificationPrefs = await _context.UserNotificationPreferences
                .FirstOrDefaultAsync(p => p.UserId == assignedUser.Id && p.NotificationType == NotificationType.ClientAssignment);

            // Send notification if preference not set or if enabled
            if (notificationPrefs == null || notificationPrefs.InAppEnabled)
            {
                var notification = new Notification
                {
                    UserId = assignedUser.Id,
                    Title = "New Case Assigned",
                    Message = $"You have been assigned to case for {caseEntity.User.FirstName} {caseEntity.User.LastName}",
                    Priority = NotificationPriority.Normal,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync().ConfigureAwait(false);
            }
        }

        await LogAuditAsync("case", "assign", "Case", id.ToString(),
            new { previousStaffId, newStaffId = request.StaffId, attorneyName = attorney.Name }).ConfigureAwait(false);

        return Ok(new { message = "Case assigned successfully" });
    }

    /// <summary>
    /// Update visa types for a case (legal professionals can update for assigned cases)
    /// </summary>
    /// <param name="id">Case ID</param>
    /// <param name="request">Visa types update request</param>
    /// <returns>Success response</returns>
    [HttpPut("{id}/visa-types")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateCaseVisaTypes(Guid id, [FromBody] UpdateCaseVisaTypesRequest request)
    {
        var caseId = new CaseId(id);
        var userId = GetCurrentUserId();
        var isAdmin = IsAdmin();

        var caseEntity = await _context.Cases
            .Include(c => c.CaseVisaTypes)
            .FirstOrDefaultAsync(c => c.Id == caseId)
            .ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails { Title = "Not Found", Detail = "Case not found." });
        }

        // Check access: admin or assigned legal professional
        var currentUser = await _context.Users.FindAsync(userId);
        var isAssignedProfessional = currentUser?.AttorneyId != null && caseEntity.AssignedStaffId == currentUser.AttorneyId;

        if (!isAdmin && !isAssignedProfessional)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = "You don't have permission to update visa types for this case."
            });
        }

        // Validate visa type count (max 5)
        if (request.VisaTypeIds.Count > 5)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Request",
                Detail = "A case can have at most 5 visa types."
            });
        }

        // Verify all visa types exist
        var visaTypes = await _context.VisaTypes
            .Where(vt => request.VisaTypeIds.Contains(vt.Id))
            .ToListAsync()
            .ConfigureAwait(false);

        if (visaTypes.Count != request.VisaTypeIds.Count)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Request",
                Detail = "One or more visa types not found."
            });
        }

        // Remove existing visa types
        _context.CaseVisaTypes.RemoveRange(caseEntity.CaseVisaTypes);

        // Add new visa types
        for (int i = 0; i < request.VisaTypeIds.Count; i++)
        {
            var visaTypeId = request.VisaTypeIds[i];
            var isPrimary = request.PrimaryVisaTypeId.HasValue && visaTypeId == request.PrimaryVisaTypeId.Value;

            caseEntity.CaseVisaTypes.Add(new CaseVisaType
            {
                CaseId = caseId,
                VisaTypeId = visaTypeId,
                DisplayOrder = i + 1,
                IsPrimary = isPrimary,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Update the legacy VisaTypeId field to the primary visa type (for backwards compatibility)
        if (request.PrimaryVisaTypeId.HasValue)
        {
            caseEntity.VisaTypeId = request.PrimaryVisaTypeId.Value;
        }
        else if (request.VisaTypeIds.Count > 0)
        {
            caseEntity.VisaTypeId = request.VisaTypeIds[0];
        }

        caseEntity.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        await LogAuditAsync("case", "update_visa_types", "Case", id.ToString(),
            new { visaTypeIds = request.VisaTypeIds, primaryId = request.PrimaryVisaTypeId }).ConfigureAwait(false);

        return Ok(new { message = "Visa types updated successfully" });
    }

    private static bool IsValidTransition(string currentStatus, string newStatus)
    {
        return currentStatus.ToLower(CultureInfo.InvariantCulture) switch
        {
            "pending" => newStatus.ToLower(CultureInfo.InvariantCulture) is "paid" or "inactive",
            "paid" => newStatus.ToLower(CultureInfo.InvariantCulture) is "active" or "inactive", 
            "active" => newStatus.ToLower(CultureInfo.InvariantCulture) is "closed" or "denied" or "inactive",
            "inactive" => newStatus.ToLower(CultureInfo.InvariantCulture) is "paid",
            "closed" or "denied" => false, // Terminal states
            _ => false
        };
    }

    private UserId GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return new UserId(userId);
        }
        throw new UnauthorizedAccessException("User ID not found in claims");
    }

    private bool IsAdmin()
    {
        return User.HasClaim("is_admin", "True") || User.IsInRole("Admin");
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

    private bool IsLegalProfessional()
    {
        return User.HasClaim("is_legal_professional", "True") || User.HasClaim("is_admin", "True");
    }
}

// DTOs
public class CaseResponse
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset LastActivityAt { get; set; }
    public string? VisaTypeCode { get; set; }
    public string? VisaTypeName { get; set; }
    public string? PackageCode { get; set; }
    public string? PackageDisplayName { get; set; }
    public DateTime CreatedAt { get; set; }
    public PriceSnapshotResponse? LatestPriceSnapshot { get; set; }
}

public class PriceSnapshotResponse
{
    public int Id { get; set; }
    public string VisaTypeCode { get; set; } = string.Empty;
    public string PackageCode { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Currency { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class UpdateCaseStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

public class SetPackageRequest
{
    public string PackageId { get; set; } = string.Empty;
}

public class CaseDashboardResponse
{
    public Guid Id { get; set; }
    public int? ClientId { get; set; }
    public string ClientFirstName { get; set; } = string.Empty;
    public string ClientLastName { get; set; } = string.Empty;
    public string ClientEmail { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset LastActivityAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? AssignedStaffId { get; set; }
    public string? AssignedStaffName { get; set; }
    public List<CaseVisaTypeInfo> VisaTypes { get; set; } = new List<CaseVisaTypeInfo>();
}

public class CaseVisaTypeInfo
{
    public int VisaTypeId { get; set; }
    public string VisaTypeCode { get; set; } = string.Empty;
    public string VisaTypeName { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public int DisplayOrder { get; set; }
}

public class AssignCaseRequest
{
    public int? StaffId { get; set; }
}

public class UpdateCaseVisaTypesRequest
{
    public List<int> VisaTypeIds { get; set; } = new List<int>();
    public int? PrimaryVisaTypeId { get; set; }
}