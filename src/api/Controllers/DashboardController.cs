using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using System.Security.Claims;
using L4H.Shared.Models;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize(Policy = "IsAdminOrLegalProfessional")]
[Tags("Dashboard")]
public class DashboardController : ControllerBase
{
    private readonly L4HDbContext _context;

    private readonly ILogger<DashboardController> _logger;

    public DashboardController(L4HDbContext context, ILogger<DashboardController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStats>> GetStats()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return BadRequest("Invalid user ID");
        }

        var user = await _context.Users.FindAsync(new UserId(userId));
        var isAdmin = User.HasClaim(c => c.Type == "is_admin" && (c.Value.Equals("true", StringComparison.OrdinalIgnoreCase))) || (user?.IsAdmin ?? false);
        var attorneyId = user?.AttorneyProfileId;

        if (!isAdmin && attorneyId == null)
        {
            _logger.LogWarning("User {UserId} accessed stats but has no AttorneyProfileId and is not Admin", userId);
        }

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);
        var startOfLastMonth = startOfMonth.AddMonths(-1);

        // Base queries
        var usersQuery = _context.Users
            .Where(u => !u.IsStaff && !u.IsAdmin && !u.IsLegalProfessional)
            .AsQueryable();
            
        var casesQuery = _context.Cases.Include(c => c.User).AsQueryable(); 
        var appointmentsQuery = _context.Appointments.AsQueryable();
        var timeEntriesQuery = _context.TimeEntries.AsQueryable();

        // Apply filters for non-admins
        if (!isAdmin)
        {
            if (attorneyId.HasValue)
            {
                usersQuery = usersQuery.Where(u => u.AssignedAttorneyId == attorneyId.Value);
                casesQuery = casesQuery.Where(c => c.AssignedStaffId == attorneyId.Value); 
                appointmentsQuery = appointmentsQuery.Where(a => a.StaffUserId == new UserId(userId)); 
                timeEntriesQuery = timeEntriesQuery.Where(t => t.AttorneyId == attorneyId.Value);
            }
            else
            {
                // If not admin and no attorney ID, they see nothing for now (staff without assignment)
                // or we could let them see all if they are staff.
                if (!(user?.IsStaff ?? false))
                {
                    return Forbid("User is not authorized to view dashboard statistics.");
                }
            }
        }

        // 1. Active Cases
        var activeCases = await casesQuery.CountAsync(c => c.Status != "Complete" && c.Status != "Closed (US Government Rejected)");

        // 2. Pending Tasks (Using Cases with "In Progress" status as proxy for now)
        var pendingTasks = await casesQuery.CountAsync(c => c.Status == "In Progress");

        // 3. Upcoming Appointments (Next 7 days)
        var nextWeek = now.AddDays(7);
        var upcomingAppointments = await appointmentsQuery.CountAsync(a => a.ScheduledStart >= now && a.ScheduledStart <= nextWeek);

        // 4. Monthly Revenue (Billable Time Entries)
        // Current Month
        var currentMonthRevenue = await timeEntriesQuery
            .Where(t => t.StartTime >= startOfMonth)
            .SumAsync(t => t.BillableAmount);

        // Last Month (for trend)
        var lastMonthRevenue = await timeEntriesQuery
            .Where(t => t.StartTime >= startOfLastMonth && t.StartTime < startOfMonth)
            .SumAsync(t => t.BillableAmount);

        // 5. New Clients (This Month)
        var newClients = await usersQuery.CountAsync(c => c.CreatedAt >= startOfMonth);

        // 6. Completed Cases (This Month)
        var completedCases = await casesQuery.CountAsync(c => c.Status == "Complete");

        return Ok(new DashboardStats
        {
            ActiveCases = activeCases,
            PendingTasks = pendingTasks,
            UpcomingAppointments = upcomingAppointments,
            MonthlyRevenue = currentMonthRevenue,
            LastMonthRevenue = lastMonthRevenue,
            NewClients = newClients,
            CompletedCases = completedCases
        });
    }

    [HttpGet("activity")]
    public async Task<ActionResult<IEnumerable<ActivityItem>>> GetRecentActivity()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return BadRequest("Invalid user ID");
        }

        var user = await _context.Users.FindAsync(new UserId(userId));
        var isAdmin = User.HasClaim(c => c.Type == "is_admin" && (c.Value.Equals("true", StringComparison.OrdinalIgnoreCase))) || (user?.IsAdmin ?? false);
        var attorneyId = user?.AttorneyProfileId;

        if (!isAdmin && attorneyId == null && !(user?.IsStaff ?? false))
        {
            return Forbid("User is not authorized to view dashboard activity.");
        }

        var activityLimit = 10;

        // 1. New Clients (Users)
        var usersQuery = _context.Users
            .Where(u => !u.IsStaff && !u.IsAdmin && !u.IsLegalProfessional)
            .AsQueryable();
            
        if (!isAdmin && attorneyId.HasValue) 
            usersQuery = usersQuery.Where(u => u.AssignedAttorneyId == attorneyId.Value);
        
        var recentClients = await usersQuery
            .OrderByDescending(c => c.CreatedAt)
            .Take(5)
            .Select(c => new ActivityItem 
            { 
                Type = "new_client", 
                Message = $"New client added: {c.FirstName} {c.LastName}", 
                Time = c.CreatedAt.ToString("o") 
            })
            .ToListAsync();

        // 2. Appointments
        var appointmentsQuery = _context.Appointments
            .Include(a => a.Case)
            .ThenInclude(c => c != null ? c.User : null)
            .AsQueryable();
            
        if (!isAdmin) 
            appointmentsQuery = appointmentsQuery.Where(a => a.StaffUserId == new UserId(userId));

        var recentAppointmentsData = await appointmentsQuery
            .OrderByDescending(a => a.CreatedAt)
            .Take(5)
            .ToListAsync();

        var recentAppointments = recentAppointmentsData
            .Select(a => new ActivityItem
            {
                Type = "appointment",
                Message = $"Appointment scheduled with {a.Case?.User?.FirstName ?? "Unknown"} {a.Case?.User?.LastName ?? "Client"}", 
                Time = a.CreatedAt.ToString("o")
            })
            .ToList();

        // 3. Time Entries
        var timeEntriesQuery = _context.TimeEntries
            .Include(t => t.User)
            .AsQueryable();
        if (!isAdmin && attorneyId.HasValue) 
            timeEntriesQuery = timeEntriesQuery.Where(t => t.AttorneyId == attorneyId.Value);

        var recentTimeData = await timeEntriesQuery
            .OrderByDescending(t => t.CreatedAt)
            .Take(5)
            .ToListAsync();

        var recentTime = recentTimeData
            .Select(t => new ActivityItem
            {
                Type = "time_entry",
                Message = $"Logged {t.Duration:F1}h for {t.User?.FirstName ?? "Unknown"} {t.User?.LastName ?? "Client"}",
                Time = t.CreatedAt.ToString("o")
            })
            .ToList();

        // Merge and sort
        var allActivity = recentClients
            .Concat(recentAppointments)
            .Concat(recentTime)
            .OrderByDescending(x => x.Time) 
            .Take(activityLimit)
            .ToList();

        // Re-assign IDs for consistent client-side rendering
        for (int i = 0; i < allActivity.Count; i++)
        {
            allActivity[i].Id = i + 1;
        }

        return Ok(allActivity);
    }
}

public class DashboardStats
{
    public int ActiveCases { get; set; }
    public int PendingTasks { get; set; }
    public int UpcomingAppointments { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public decimal LastMonthRevenue { get; set; }
    public int NewClients { get; set; }
    public int CompletedCases { get; set; }
}

public class ActivityItem
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
}
