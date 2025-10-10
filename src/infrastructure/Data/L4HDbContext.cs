using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Data;

public class L4HDbContext : DbContext
{
    public L4HDbContext(DbContextOptions<L4HDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Case> Cases { get; set; }
    public DbSet<GuardianLink> GuardianLinks { get; set; }
    public DbSet<InterviewSession> InterviewSessions { get; set; }
    public DbSet<VisaRecommendation> VisaRecommendations { get; set; }
    public DbSet<RememberMeToken> RememberMeTokens { get; set; }
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
    public DbSet<VisaType> VisaTypes { get; set; }
    public DbSet<Package> Packages { get; set; }
    public DbSet<PricingRule> PricingRules { get; set; }
    public DbSet<CasePriceSnapshot> CasePriceSnapshots { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<InterviewQA> InterviewQAs { get; set; }
    public DbSet<Country> Countries { get; set; }
    public DbSet<CountryVisaType> CountryVisaTypes { get; set; }
    public DbSet<USSubdivision> USSubdivisions { get; set; }
    public DbSet<VisaClass> VisaClasses { get; set; }
    public DbSet<CategoryClass> CategoryClasses { get; set; }
    public DbSet<VisaChangeRequest> VisaChangeRequests { get; set; }
    public DbSet<PriceDeltaLedger> PriceDeltaLedgers { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<RescheduleProposal> RescheduleProposals { get; set; }
    public DbSet<AvailabilityBlock> AvailabilityBlocks { get; set; }
    public DbSet<AdminSettings> AdminSettings { get; set; }
    public DbSet<MessageThread> MessageThreads { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<DailyDigestQueue> DailyDigestQueues { get; set; }
    public DbSet<Upload> Uploads { get; set; }
    public DbSet<FormTemplate> FormTemplates { get; set; }
    public DbSet<FormField> FormFields { get; set; }
    public DbSet<FieldBinding> FieldBindings { get; set; }
    public DbSet<FormInstance> FormInstances { get; set; }
    public DbSet<RetentionQueue> RetentionQueues { get; set; }

    // Security entities
    public DbSet<EmailVerificationToken> EmailVerificationTokens { get; set; }
    public DbSet<UserSession> UserSessions { get; set; }

    // Stripe payments entities
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Refund> Refunds { get; set; }
    public DbSet<WebhookEvent> WebhookEvents { get; set; }

    // Teams meetings entities
    public DbSet<Meeting> Meetings { get; set; }

    // Scraper workflow entities
    public DbSet<WorkflowVersion> WorkflowVersions { get; set; }
    public DbSet<WorkflowStep> WorkflowSteps { get; set; }
    public DbSet<WorkflowDoctor> WorkflowDoctors { get; set; }
    public DbSet<ScrapedDocument> ScrapedDocuments { get; set; }
    public DbSet<CountryServiceMapping> CountryServiceMappings { get; set; }

    // Approved doctors entity
    public DbSet<ApprovedDoctor> ApprovedDoctors { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure UserId and CaseId converters
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id)
                .HasConversion(
                    v => v.Value,
                    v => new UserId(v));

            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.PasswordHash).HasMaxLength(500);
        });

        modelBuilder.Entity<Case>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id)
                .HasConversion(
                    v => v.Value,
                    v => new CaseId(v));

            entity.Property(e => e.UserId)
                .HasConversion(
                    v => v.Value,
                    v => new UserId(v));

            entity.Property(e => e.Status).HasMaxLength(50);
        });

        // Configure EmailVerificationToken
        modelBuilder.Entity<EmailVerificationToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId)
                .HasConversion(
                    v => v.Value,
                    v => new UserId(v));
            entity.Property(e => e.TokenHash).HasMaxLength(500);
            entity.HasIndex(e => e.TokenHash);
            entity.HasIndex(e => e.UserId);
        });

        // Configure UserSession
        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId)
                .HasConversion(
                    v => v.Value,
                    v => new UserId(v));
            entity.Property(e => e.RefreshIdHash).HasMaxLength(500);
            entity.Property(e => e.IpHash).HasMaxLength(500);
            entity.Property(e => e.UserAgent).HasMaxLength(1000);
            entity.HasIndex(e => e.RefreshIdHash);
            entity.HasIndex(e => e.UserId);
        });

        modelBuilder.Entity<GuardianLink>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.ChildUserId)
                .HasConversion(
                    v => v.Value,
                    v => new UserId(v));

            entity.Property(e => e.GuardianUserId)
                .HasConversion(
                    v => v.Value,
                    v => new UserId(v));

            entity.Property(e => e.Status).HasMaxLength(50);

            entity.HasOne(e => e.ChildUser)
                .WithMany(e => e.ChildLinks)
                .HasForeignKey(e => e.ChildUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.GuardianUser)
                .WithMany(e => e.GuardianLinks)
                .HasForeignKey(e => e.GuardianUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.ChildUserId);
            entity.HasIndex(e => e.GuardianUserId);
        });

        modelBuilder.Entity<InterviewSession>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.UserId)
                .HasConversion(
                    v => v.Value,
                    v => new UserId(v));

            entity.Property(e => e.CaseId)
                .HasConversion(
                    v => v.Value,
                    v => new CaseId(v));

            entity.Property(e => e.Status).HasMaxLength(50);

            entity.HasOne(e => e.User)
                .WithMany(e => e.InterviewSessions)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Case)
                .WithMany(e => e.InterviewSessions)
                .HasForeignKey(e => e.CaseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CaseId);
        });

        modelBuilder.Entity<VisaRecommendation>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.CaseId)
                .HasConversion(
                    v => v.Value,
                    v => new CaseId(v));

            entity.Property(e => e.Rationale).HasMaxLength(2000);

            entity.HasOne(e => e.Case)
                .WithMany(e => e.VisaRecommendations)
                .HasForeignKey(e => e.CaseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.VisaType)
                .WithMany()
                .HasForeignKey(e => e.VisaTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.CaseId);
            entity.HasIndex(e => e.VisaTypeId);
        });

        modelBuilder.Entity<RememberMeToken>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.UserId)
                .HasConversion(
                    v => v.Value,
                    v => new UserId(v));

            entity.Property(e => e.TokenHash).HasMaxLength(500);

            entity.HasOne(e => e.User)
                .WithMany(e => e.RememberMeTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.TokenHash);
            entity.HasIndex(e => e.ExpiresAt);
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.UserId)
                .HasConversion(
                    v => v.Value,
                    v => new UserId(v));

            entity.Property(e => e.TokenHash).HasMaxLength(500);

            entity.HasOne(e => e.User)
                .WithMany(e => e.PasswordResetTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.TokenHash);
            entity.HasIndex(e => e.ExpiresAt);
        });

        modelBuilder.Entity<VisaType>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<Package>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.DisplayName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<PricingRule>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CountryCode).HasMaxLength(2).IsRequired();
            entity.Property(e => e.Currency).HasMaxLength(3).IsRequired();
            entity.Property(e => e.FxSurchargeMode).HasMaxLength(50);
            entity.Property(e => e.BasePrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TaxRate).HasColumnType("decimal(5,4)");

            entity.HasOne(e => e.VisaType)
                .WithMany(e => e.PricingRules)
                .HasForeignKey(e => e.VisaTypeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Package)
                .WithMany(e => e.PricingRules)
                .HasForeignKey(e => e.PackageId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.VisaTypeId, e.PackageId, e.CountryCode }).IsUnique();
        });

        modelBuilder.Entity<CasePriceSnapshot>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CaseId)
                .HasConversion(
                    v => v.Value,
                    v => new CaseId(v));
            entity.Property(e => e.VisaTypeCode).HasMaxLength(10).IsRequired();
            entity.Property(e => e.PackageCode).HasMaxLength(50).IsRequired();
            entity.Property(e => e.CountryCode).HasMaxLength(2).IsRequired();
            entity.Property(e => e.Currency).HasMaxLength(3).IsRequired();
            entity.Property(e => e.Total).HasColumnType("decimal(18,2)");

            entity.HasOne(e => e.Case)
                .WithMany(e => e.PriceSnapshots)
                .HasForeignKey(e => e.CaseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Category).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Action).HasMaxLength(100).IsRequired();
            entity.Property(e => e.TargetType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.TargetId).HasMaxLength(100).IsRequired();
            
            entity.Property(e => e.ActorUserId)
                .HasConversion(
                    v => v.HasValue ? v.Value.Value : (Guid?)null,
                    v => v.HasValue ? new UserId(v.Value) : (UserId?)null);

            entity.HasOne(e => e.ActorUser)
                .WithMany()
                .HasForeignKey(e => e.ActorUserId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.TargetType);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Update Case entity configuration for new navigation properties
        modelBuilder.Entity<Case>(entity =>
        {
            entity.HasOne(e => e.VisaType)
                .WithMany(e => e.Cases)
                .HasForeignKey(e => e.VisaTypeId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Package)
                .WithMany(e => e.Cases)
                .HasForeignKey(e => e.PackageId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<InterviewQA>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.QuestionKey).HasMaxLength(200).IsRequired();
            entity.Property(e => e.AnswerValue).HasMaxLength(2000).IsRequired();

            entity.HasOne(e => e.Session)
                .WithMany(e => e.QAs)
                .HasForeignKey(e => e.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.SessionId, e.StepNumber }).IsUnique();
        });

        modelBuilder.Entity<Country>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Iso2).HasMaxLength(2).IsRequired();
            entity.Property(e => e.Iso3).HasMaxLength(3).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();

            entity.HasIndex(e => e.Iso2).IsUnique();
            entity.HasIndex(e => e.Iso3).IsUnique();
        });

        modelBuilder.Entity<CountryVisaType>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Notes).HasMaxLength(500);

            entity.HasOne(e => e.Country)
                .WithMany()
                .HasForeignKey(e => e.CountryId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.VisaType)
                .WithMany()
                .HasForeignKey(e => e.VisaTypeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.CountryId, e.VisaTypeId }).IsUnique();
            entity.HasIndex(e => e.CountryId);
            entity.HasIndex(e => e.VisaTypeId);
        });

        modelBuilder.Entity<USSubdivision>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();

            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<VisaClass>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.GeneralCategory).HasMaxLength(100);

            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<CategoryClass>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ClassCode).HasMaxLength(10).IsRequired();
            entity.Property(e => e.ClassName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.GeneralCategory).HasMaxLength(200).IsRequired();

            entity.HasIndex(e => e.ClassCode).IsUnique();
            entity.HasIndex(e => e.IsActive);
        });

        modelBuilder.Entity<VisaChangeRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CaseId)
                .HasConversion(
                    v => v.Value,
                    v => new CaseId(v));
            entity.Property(e => e.RequestedByStaffId)
                .HasConversion(
                    v => v.Value,
                    v => new UserId(v));
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Currency).HasMaxLength(3).IsRequired();
            entity.Property(e => e.DeltaAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Notes).HasMaxLength(1000);

            entity.HasOne(e => e.Case)
                .WithMany(e => e.VisaChangeRequests)
                .HasForeignKey(e => e.CaseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.OldVisaType)
                .WithMany()
                .HasForeignKey(e => e.OldVisaTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.NewVisaType)
                .WithMany()
                .HasForeignKey(e => e.NewVisaTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.RequestedByStaff)
                .WithMany(e => e.RequestedVisaChanges)
                .HasForeignKey(e => e.RequestedByStaffId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.CaseId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ExpiresAt);
        });

        modelBuilder.Entity<PriceDeltaLedger>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CaseId)
                .HasConversion(
                    v => v.Value,
                    v => new CaseId(v));
            entity.Property(e => e.ApprovedByUserId)
                .HasConversion(
                    v => v.HasValue ? v.Value.Value : (Guid?)null,
                    v => v.HasValue ? new UserId(v.Value) : (UserId?)null);
            entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Currency).HasMaxLength(3).IsRequired();
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Description).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.StripePaymentIntentId).HasMaxLength(200);
            entity.Property(e => e.StripeRefundId).HasMaxLength(200);
            entity.Property(e => e.ProcessorResponse).HasMaxLength(2000);

            entity.HasOne(e => e.Case)
                .WithMany(e => e.PriceDeltaLedgers)
                .HasForeignKey(e => e.CaseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.VisaChangeRequest)
                .WithMany()
                .HasForeignKey(e => e.VisaChangeRequestId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.ApprovedByUser)
                .WithMany()
                .HasForeignKey(e => e.ApprovedByUserId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasIndex(e => e.CaseId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Type);
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CaseId)
                .HasConversion(
                    v => v.Value,
                    v => new CaseId(v));
            entity.Property(e => e.StaffUserId)
                .HasConversion(
                    v => v.Value,
                    v => new UserId(v));
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.Property(e => e.CancellationReason).HasMaxLength(500);
            
            // Configure computed properties to work with EF Core
            // Ignore StaffId since it's just a wrapper for StaffUserId
            entity.Ignore(e => e.StaffId);
            
            // Ignore StartTime since it's just a wrapper for ScheduledStart
            entity.Ignore(e => e.StartTime);
            
            // DurationMinutes is computed from ScheduledStart and ScheduledEnd
            // We'll ignore it and use raw SQL or computed columns for queries
            entity.Ignore(e => e.DurationMinutes);

            entity.HasOne(e => e.Case)
                .WithMany(e => e.Appointments)
                .HasForeignKey(e => e.CaseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Staff)
                .WithMany(e => e.StaffAppointments)
                .HasForeignKey(e => e.StaffUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.CaseId);
            entity.HasIndex(e => e.StaffUserId);
            entity.HasIndex(e => e.ScheduledStart);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<RescheduleProposal>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.InitiatedBy).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TimeZone).HasMaxLength(100).IsRequired();
            entity.Property(e => e.RejectionReason).HasMaxLength(500);

            entity.HasOne(e => e.Appointment)
                .WithMany(e => e.RescheduleProposals)
                .HasForeignKey(e => e.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.AppointmentId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ExpiresAt);
        });

        modelBuilder.Entity<AvailabilityBlock>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.StaffId)
                .HasConversion(
                    v => v.Value,
                    v => new UserId(v));
            entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TimeZone).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Reason).HasMaxLength(500);
            entity.Property(e => e.RecurrencePattern).HasMaxLength(2000);
            
            // Ignore wrapper property
            entity.Ignore(e => e.StaffUserId);

            entity.HasOne(e => e.Staff)
                .WithMany(e => e.AvailabilityBlocks)
                .HasForeignKey(e => e.StaffId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.StaffId);
            entity.HasIndex(e => e.StartTime);
            entity.HasIndex(e => e.EndTime);
            entity.HasIndex(e => e.Type);
        });

        modelBuilder.Entity<AdminSettings>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Key).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Value).HasMaxLength(2000).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.Property(e => e.UpdatedByUserId)
                .HasConversion(
                    v => v.HasValue ? v.Value.Value : (Guid?)null,
                    v => v.HasValue ? new UserId(v.Value) : (UserId?)null);

            entity.HasOne(e => e.UpdatedByUser)
                .WithMany()
                .HasForeignKey(e => e.UpdatedByUserId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasIndex(e => e.Key).IsUnique();
            entity.HasIndex(e => e.UpdatedAt);
        });

        modelBuilder.Entity<MessageThread>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CaseId)
                .HasConversion(
                    v => v.Value,
                    v => new CaseId(v));
            entity.Property(e => e.Subject).HasMaxLength(200);

            entity.HasOne(e => e.Case)
                .WithMany(e => e.MessageThreads)
                .HasForeignKey(e => e.CaseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.CaseId);
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SenderUserId)
                .HasConversion(
                    v => v.Value,
                    v => new UserId(v));
            entity.Property(e => e.Body).HasMaxLength(4000).IsRequired();
            entity.Property(e => e.Channel).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ReadByJson).HasMaxLength(2000);

            entity.HasOne(e => e.Thread)
                .WithMany(e => e.Messages)
                .HasForeignKey(e => e.ThreadId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Sender)
                .WithMany(e => e.SentMessages)
                .HasForeignKey(e => e.SenderUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.ThreadId, e.SentAt });
        });

        modelBuilder.Entity<DailyDigestQueue>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId)
                .HasConversion(
                    v => v.Value,
                    v => new UserId(v));
            entity.Property(e => e.ItemsJson).IsRequired();

            entity.HasOne(e => e.User)
                .WithMany(e => e.DigestQueues)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.LastSentAt);
        });

        modelBuilder.Entity<Upload>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CaseId)
                .HasConversion(
                    v => v.Value,
                    v => new CaseId(v));
            entity.Property(e => e.OriginalName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Mime).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Key).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.StorageUrl).HasMaxLength(1000);

            entity.HasOne(e => e.Case)
                .WithMany(e => e.Uploads)
                .HasForeignKey(e => e.CaseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.CaseId, e.CreatedAt });
            entity.HasIndex(e => e.Status);
        });

        // Forms system configurations
        modelBuilder.Entity<FormTemplate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.VisaTypeId).HasMaxLength(50);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000);

            entity.HasIndex(e => new { e.Code, e.Version }).IsUnique();
        });

        modelBuilder.Entity<FormField>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LabelKey).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Type).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.DataKey).HasMaxLength(200);

            entity.HasOne(e => e.Template)
                .WithMany(e => e.Fields)
                .HasForeignKey(e => e.TemplateId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.TemplateId, e.Name }).IsUnique();
        });

        modelBuilder.Entity<FieldBinding>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DataKey).HasMaxLength(200).IsRequired();

            entity.HasOne(e => e.Template)
                .WithMany(e => e.Bindings)
                .HasForeignKey(e => e.TemplateId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.FormField)
                .WithMany(e => e.Bindings)
                .HasForeignKey(e => e.FormFieldId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.TemplateId, e.FormFieldId, e.DataKey }).IsUnique();
        });

        modelBuilder.Entity<FormInstance>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CaseId)
                .HasConversion(
                    v => v.Value,
                    v => new CaseId(v));
            entity.Property(e => e.DataSnapshotJson).IsRequired();
            entity.Property(e => e.PdfPath).HasMaxLength(1000).IsRequired();

            entity.HasOne(e => e.Case)
                .WithMany(e => e.FormInstances)
                .HasForeignKey(e => e.CaseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Template)
                .WithMany(e => e.Instances)
                .HasForeignKey(e => e.TemplateId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.CaseId, e.CreatedAt });
            entity.HasIndex(e => e.TemplateId);
        });

        modelBuilder.Entity<RetentionQueue>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Category).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TargetId).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Action).HasConversion<string>().HasMaxLength(20);

            entity.HasIndex(e => new { e.Category, e.EnqueuedAt });
            entity.HasIndex(e => e.ProcessedAt);
        });

        // Configure Stripe payments entities
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CaseId)
                .HasConversion(
                    v => v.Value,
                    v => new CaseId(v));
            entity.Property(e => e.InvoiceNumber).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Currency).HasMaxLength(3).IsRequired();
            entity.Property(e => e.Total).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.StripeCheckoutSessionId).HasMaxLength(200);

            entity.HasOne(e => e.Case)
                .WithMany(e => e.Invoices)
                .HasForeignKey(e => e.CaseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.InvoiceNumber).IsUnique();
            entity.HasIndex(e => e.CaseId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => new { e.Year, e.SequentialNumber }).IsUnique();
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.StripePaymentIntentId).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Currency).HasMaxLength(3).IsRequired();
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.FailureReason).HasMaxLength(500);

            entity.HasOne(e => e.Invoice)
                .WithMany(e => e.Payments)
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.StripePaymentIntentId).IsUnique();
            entity.HasIndex(e => e.InvoiceId);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<Refund>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.StripeRefundId).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Currency).HasMaxLength(3).IsRequired();
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Reason).HasMaxLength(200).IsRequired();
            entity.Property(e => e.FailureReason).HasMaxLength(500);

            entity.HasOne(e => e.Invoice)
                .WithMany(e => e.Refunds)
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.StripeRefundId).IsUnique();
            entity.HasIndex(e => e.InvoiceId);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<WebhookEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.StripeEventId).HasMaxLength(200).IsRequired();
            entity.Property(e => e.EventType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ProcessingError).HasMaxLength(2000);

            entity.HasIndex(e => e.StripeEventId).IsUnique();
            entity.HasIndex(e => e.EventType);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Configure Teams meetings entity
        modelBuilder.Entity<Meeting>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Provider).HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.MeetingId).HasMaxLength(200).IsRequired();
            entity.Property(e => e.JoinUrl).HasMaxLength(1000).IsRequired();

            entity.HasOne(e => e.Appointment)
                .WithOne(e => e.Meeting)
                .HasForeignKey<Meeting>(e => e.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.AppointmentId).IsUnique();
            entity.HasIndex(e => e.Provider);
        });

        // Configure Scraper workflow entities
        modelBuilder.Entity<WorkflowVersion>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CountryCode).HasMaxLength(2).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Source).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ScrapeHash).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Notes).HasMaxLength(2000);
            entity.Property(e => e.SummaryJson).HasMaxLength(4000);

            entity.Property(e => e.ApprovedBy)
                .HasConversion(
                    v => v.HasValue ? v.Value.Value : (Guid?)null,
                    v => v.HasValue ? new UserId(v.Value) : (UserId?)null);

            entity.HasOne(e => e.VisaType)
                .WithMany()
                .HasForeignKey(e => e.VisaTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ApprovedByUser)
                .WithMany()
                .HasForeignKey(e => e.ApprovedBy)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasIndex(e => new { e.VisaTypeId, e.CountryCode, e.Version }).IsUnique();
            entity.HasIndex(e => e.CountryCode);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ScrapeHash);
        });

        modelBuilder.Entity<WorkflowStep>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Key).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Title).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(2000).IsRequired();
            entity.Property(e => e.DataJson).HasMaxLength(4000);

            entity.HasOne(e => e.WorkflowVersion)
                .WithMany(e => e.Steps)
                .HasForeignKey(e => e.WorkflowVersionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.WorkflowVersionId, e.Ordinal }).IsUnique();
            entity.HasIndex(e => new { e.WorkflowVersionId, e.Key }).IsUnique();
        });

        modelBuilder.Entity<WorkflowDoctor>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Address).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Phone).HasMaxLength(50);
            entity.Property(e => e.City).HasMaxLength(100).IsRequired();
            entity.Property(e => e.CountryCode).HasMaxLength(2).IsRequired();
            entity.Property(e => e.SourceUrl).HasMaxLength(1000).IsRequired();

            entity.HasOne(e => e.WorkflowVersion)
                .WithMany(e => e.Doctors)
                .HasForeignKey(e => e.WorkflowVersionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.WorkflowVersionId);
            entity.HasIndex(e => e.CountryCode);
        });

        modelBuilder.Entity<ScrapedDocument>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CountryCode).HasMaxLength(2).IsRequired();
            entity.Property(e => e.VisaTypeCode).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Source).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Url).HasMaxLength(2000).IsRequired();
            entity.Property(e => e.Sha256).HasMaxLength(64).IsRequired();
            entity.Property(e => e.Content).IsRequired();
            entity.Property(e => e.HeadersJson).HasMaxLength(2000);

            entity.HasIndex(e => new { e.CountryCode, e.VisaTypeCode, e.Source });
            entity.HasIndex(e => e.Sha256).IsUnique();
            entity.HasIndex(e => e.FetchedAt);
        });

        modelBuilder.Entity<CountryServiceMapping>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Service).HasMaxLength(100).IsRequired();
            entity.Property(e => e.FromCountry).HasMaxLength(2).IsRequired();
            entity.Property(e => e.ToCountry).HasMaxLength(2).IsRequired();
            entity.Property(e => e.Notes).HasMaxLength(1000);

            entity.HasIndex(e => new { e.Service, e.FromCountry }).IsUnique();
            entity.HasIndex(e => e.ToCountry);
        });
    }
}