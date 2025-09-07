using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class Case
{
    public CaseId Id { get; set; } = CaseId.New();
    public UserId UserId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset LastActivityAt { get; set; } = DateTimeOffset.UtcNow;
    public int? VisaTypeId { get; set; }
    public int? PackageId { get; set; }
    public Guid? AssignedStaffId { get; set; }
    public bool IsInterviewLocked { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public VisaType? VisaType { get; set; }
    public Package? Package { get; set; }
    public ICollection<CasePriceSnapshot> PriceSnapshots { get; set; } = new List<CasePriceSnapshot>();
    public ICollection<InterviewSession> InterviewSessions { get; set; } = new List<InterviewSession>();
    public ICollection<VisaRecommendation> VisaRecommendations { get; set; } = new List<VisaRecommendation>();
    public ICollection<VisaChangeRequest> VisaChangeRequests { get; set; } = new List<VisaChangeRequest>();
    public ICollection<PriceDeltaLedger> PriceDeltaLedgers { get; set; } = new List<PriceDeltaLedger>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<MessageThread> MessageThreads { get; set; } = new List<MessageThread>();
    public ICollection<Upload> Uploads { get; set; } = new List<Upload>();
    public ICollection<FormInstance> FormInstances { get; set; } = new List<FormInstance>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}