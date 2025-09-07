using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class VisaChangeRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public CaseId CaseId { get; set; }
    public int OldVisaTypeId { get; set; }
    public int NewVisaTypeId { get; set; }
    public string Status { get; set; } = "pending"; // pending, approved, expired, rejected
    public UserId RequestedByStaffId { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(7);
    public DateTime? ApprovedByClientAt { get; set; }
    public DateTime? RejectedByClientAt { get; set; }
    public decimal DeltaAmount { get; set; }
    public string Currency { get; set; } = "USD";
    public string? BreakdownJson { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public Case Case { get; set; } = null!;
    public VisaType OldVisaType { get; set; } = null!;
    public VisaType NewVisaType { get; set; } = null!;
    public User RequestedByStaff { get; set; } = null!;
}