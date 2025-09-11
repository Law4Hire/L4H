using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class User
{
    public UserId Id { get; set; } = UserId.New();
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool EmailVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime PasswordUpdatedAt { get; set; }
    public int FailedLoginCount { get; set; }
    public DateTimeOffset? LockoutUntil { get; set; }
    public bool IsAdmin { get; set; }
    public bool IsStaff { get; set; }

    // Navigation properties
    public ICollection<Case> Cases { get; set; } = new List<Case>();
    public ICollection<GuardianLink> ChildLinks { get; set; } = new List<GuardianLink>();
    public ICollection<GuardianLink> GuardianLinks { get; set; } = new List<GuardianLink>();
    public ICollection<InterviewSession> InterviewSessions { get; set; } = new List<InterviewSession>();
    public ICollection<VisaRecommendation> VisaRecommendations { get; set; } = new List<VisaRecommendation>();
    public ICollection<RememberMeToken> RememberMeTokens { get; set; } = new List<RememberMeToken>();
    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();
    public ICollection<VisaChangeRequest> RequestedVisaChanges { get; set; } = new List<VisaChangeRequest>();
    public ICollection<Appointment> StaffAppointments { get; set; } = new List<Appointment>();
    public ICollection<AvailabilityBlock> AvailabilityBlocks { get; set; } = new List<AvailabilityBlock>();
    public ICollection<Message> SentMessages { get; set; } = new List<Message>();
    public ICollection<DailyDigestQueue> DigestQueues { get; set; } = new List<DailyDigestQueue>();
    public ICollection<EmailVerificationToken> EmailVerificationTokens { get; set; } = new List<EmailVerificationToken>();
    public ICollection<UserSession> UserSessions { get; set; } = new List<UserSession>();
}