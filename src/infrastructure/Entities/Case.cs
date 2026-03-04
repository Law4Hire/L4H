using L4H.Shared.Models;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;

namespace L4H.Infrastructure.Entities;

public class Case
{
    public CaseId Id { get; set; } = CaseId.New();
    public UserId UserId { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
    public DateTimeOffset LastActivityAt { get; set; } = DateTimeOffset.UtcNow;
    public int? VisaTypeId { get; set; }
    public int? PackageId { get; set; }
    public int? AssignedStaffId { get; set; }
    public bool IsInterviewLocked { get; set; }

    // Unified Cannlaw Fields
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string Notes { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string GovernmentCaseNumber { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string RejectionReason { get; set; } = string.Empty;

    public DateTime? StartDate { get; set; }
    public DateTime? CompletionDate { get; set; }

    // Attorney lock-in fields
    public int? AttorneySelectedVisaTypeId { get; set; }
    public bool IsVisaLockedByAttorney { get; set; }
    public DateTime? VisaLockedAt { get; set; }
    public Guid? VisaLockedByStaffId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [JsonIgnore]

    public User User { get; set; } = null!;
    [JsonIgnore]

    public VisaType? VisaType { get; set; }
    [JsonIgnore]

    public VisaType? AttorneySelectedVisaType { get; set; }
    [JsonIgnore]

    public Package? Package { get; set; }
    [JsonIgnore]

    public ICollection<CaseStatusHistory> StatusHistory { get; set; } = new List<CaseStatusHistory>();
    [JsonIgnore]

    public ICollection<CasePriceSnapshot> PriceSnapshots { get; set; } = new List<CasePriceSnapshot>();
    [JsonIgnore]

    public ICollection<InterviewSession> InterviewSessions { get; set; } = new List<InterviewSession>();
    [JsonIgnore]

    public ICollection<VisaRecommendation> VisaRecommendations { get; set; } = new List<VisaRecommendation>();
    [JsonIgnore]

    public ICollection<VisaChangeRequest> VisaChangeRequests { get; set; } = new List<VisaChangeRequest>();
    [JsonIgnore]

    public ICollection<PriceDeltaLedger> PriceDeltaLedgers { get; set; } = new List<PriceDeltaLedger>();
    [JsonIgnore]

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    [JsonIgnore]

    public ICollection<MessageThread> MessageThreads { get; set; } = new List<MessageThread>();
    [JsonIgnore]

    public ICollection<Upload> Uploads { get; set; } = new List<Upload>();
    [JsonIgnore]

    public ICollection<FormInstance> FormInstances { get; set; } = new List<FormInstance>();
    [JsonIgnore]

    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    [JsonIgnore]

    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
    [JsonIgnore]

    public ICollection<CaseVisaType> CaseVisaTypes { get; set; } = new List<CaseVisaType>();
}