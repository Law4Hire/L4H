using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.SeedData;

public class CannlawClientBillingSeeder : ISeedTask
{
    private readonly L4HDbContext _context;
    private readonly ILogger<CannlawClientBillingSeeder> _logger;

    public string Name => "Cannlaw Client Billing System";

    public CannlawClientBillingSeeder(L4HDbContext context, ILogger<CannlawClientBillingSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Starting Cannlaw Client Billing System seeding...");

        // Seed Attorneys
        await SeedAttorneysAsync();
        
        // Seed Billing Rates
        await SeedBillingRatesAsync();
        
        // Seed Sample Clients
        await SeedClientsAsync();
        
        // Seed Sample Cases
        await SeedCasesAsync();
        
        // Seed Sample Time Entries
        await SeedTimeEntriesAsync();
        
        // Seed Sample Documents
        await SeedDocumentsAsync();
        
        // Seed Notification Templates
        await SeedNotificationTemplatesAsync();
        
        // Create Admin User
        await CreateAdminUserAsync();

        await _context.SaveChangesAsync();
        _logger.LogInformation("Cannlaw Client Billing System seeding completed.");
    }

    private async Task SeedAttorneysAsync()
    {
        if (await _context.Attorneys.AnyAsync())
        {
            _logger.LogInformation("Attorneys already exist, skipping attorney seeding.");
            return;
        }

        var attorneys = new[]
        {
            new Attorney
            {
                Name = "Sarah Johnson",
                Title = "Managing Partner",
                Bio = "Sarah Johnson is a seasoned immigration attorney with over 15 years of experience helping families navigate complex immigration processes. She specializes in family-based immigration, naturalization, and deportation defense.",
                Email = "sarah.johnson@cannlaw.com",
                Phone = "(555) 123-4567",
                DirectPhone = "(555) 123-4501",
                DirectEmail = "sarah.direct@cannlaw.com",
                OfficeLocation = "Main Office - Suite 1200",
                DefaultHourlyRate = 350.00m,
                IsActive = true,
                IsManagingAttorney = true,
                DisplayOrder = 1,
                Credentials = "[\"J.D. Harvard Law School\", \"Licensed in NY, CA, FL\", \"Member of AILA\"]",
                PracticeAreas = "[\"Family Immigration\", \"Naturalization\", \"Deportation Defense\", \"Business Immigration\"]",
                Languages = "[\"English\", \"Spanish\", \"French\"]"
            },
            new Attorney
            {
                Name = "Michael Chen",
                Title = "Senior Associate",
                Bio = "Michael Chen focuses on business immigration and employment-based visa applications. He has successfully handled hundreds of H-1B, L-1, and EB-5 cases for clients ranging from startups to Fortune 500 companies.",
                Email = "michael.chen@cannlaw.com",
                Phone = "(555) 123-4568",
                DirectPhone = "(555) 123-4502",
                DirectEmail = "michael.direct@cannlaw.com",
                OfficeLocation = "Main Office - Suite 1201",
                DefaultHourlyRate = 275.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 2,
                Credentials = "[\"J.D. Stanford Law School\", \"Licensed in CA, NY\", \"Certified Immigration Specialist\"]",
                PracticeAreas = "[\"Business Immigration\", \"Employment Visas\", \"EB-5 Investment\", \"PERM Labor Certification\"]",
                Languages = "[\"English\", \"Mandarin\", \"Cantonese\"]"
            },
            new Attorney
            {
                Name = "Maria Rodriguez",
                Title = "Associate Attorney",
                Bio = "Maria Rodriguez is passionate about helping individuals and families achieve their American dream. She specializes in asylum cases, family reunification, and VAWA petitions.",
                Email = "maria.rodriguez@cannlaw.com",
                Phone = "(555) 123-4569",
                DirectPhone = "(555) 123-4503",
                DirectEmail = "maria.direct@cannlaw.com",
                OfficeLocation = "Branch Office - Downtown",
                DefaultHourlyRate = 225.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 3,
                Credentials = "[\"J.D. Georgetown University Law Center\", \"Licensed in NY, NJ\", \"Certified in Immigration Law\"]",
                PracticeAreas = "[\"Asylum & Refugee Law\", \"Family Immigration\", \"VAWA Petitions\", \"Removal Defense\"]",
                Languages = "[\"English\", \"Spanish\", \"Portuguese\"]"
            }
        };

        _context.Attorneys.AddRange(attorneys);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"Seeded {attorneys.Length} attorneys.");
    }

    private async Task SeedBillingRatesAsync()
    {
        if (await _context.BillingRates.AnyAsync())
        {
            _logger.LogInformation("Billing rates already exist, skipping billing rates seeding.");
            return;
        }

        var attorneys = await _context.Attorneys.ToListAsync();
        var billingRates = new List<BillingRate>();

        foreach (var attorney in attorneys)
        {
            // Standard consultation rate
            billingRates.Add(new BillingRate
            {
                AttorneyId = attorney.Id,
                ServiceType = "Initial Consultation",
                HourlyRate = attorney.DefaultHourlyRate * 0.8m, // 20% discount for consultations
                EffectiveDate = DateTime.UtcNow.AddMonths(-6),
                IsActive = true,
                Notes = "Initial consultation rate with 20% discount",
                CreatedBy = "System",
                UpdatedBy = "System"
            });

            // Document preparation rate
            billingRates.Add(new BillingRate
            {
                AttorneyId = attorney.Id,
                ServiceType = "Document Preparation",
                HourlyRate = attorney.DefaultHourlyRate,
                EffectiveDate = DateTime.UtcNow.AddMonths(-6),
                IsActive = true,
                Notes = "Standard document preparation rate",
                CreatedBy = "System",
                UpdatedBy = "System"
            });

            // Court representation rate (premium)
            billingRates.Add(new BillingRate
            {
                AttorneyId = attorney.Id,
                ServiceType = "Court Representation",
                HourlyRate = attorney.DefaultHourlyRate * 1.2m, // 20% premium for court work
                EffectiveDate = DateTime.UtcNow.AddMonths(-6),
                IsActive = true,
                Notes = "Court representation with 20% premium",
                CreatedBy = "System",
                UpdatedBy = "System"
            });
        }

        _context.BillingRates.AddRange(billingRates);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"Seeded {billingRates.Count} billing rates.");
    }

    private async Task SeedClientsAsync()
    {
        if (await _context.Clients.AnyAsync())
        {
            _logger.LogInformation("Clients already exist, skipping client seeding.");
            return;
        }

        var attorneys = await _context.Attorneys.ToListAsync();
        var clients = new[]
        {
            new Client
            {
                FirstName = "John",
                LastName = "Smith",
                Email = "john.smith@email.com",
                Phone = "(555) 234-5678",
                Address = "123 Main St, New York, NY 10001",
                DateOfBirth = new DateTime(1985, 3, 15),
                CountryOfOrigin = "United Kingdom",
                AssignedAttorneyId = attorneys[0].Id, // Sarah Johnson
                CreatedBy = "System",
                UpdatedBy = "System"
            },
            new Client
            {
                FirstName = "Ana",
                LastName = "Garcia",
                Email = "ana.garcia@email.com",
                Phone = "(555) 345-6789",
                Address = "456 Oak Ave, Los Angeles, CA 90210",
                DateOfBirth = new DateTime(1990, 7, 22),
                CountryOfOrigin = "Mexico",
                AssignedAttorneyId = attorneys[2].Id, // Maria Rodriguez
                CreatedBy = "System",
                UpdatedBy = "System"
            },
            new Client
            {
                FirstName = "Wei",
                LastName = "Zhang",
                Email = "wei.zhang@email.com",
                Phone = "(555) 456-7890",
                Address = "789 Pine St, San Francisco, CA 94102",
                DateOfBirth = new DateTime(1988, 11, 8),
                CountryOfOrigin = "China",
                AssignedAttorneyId = attorneys[1].Id, // Michael Chen
                CreatedBy = "System",
                UpdatedBy = "System"
            },
            new Client
            {
                FirstName = "Priya",
                LastName = "Patel",
                Email = "priya.patel@email.com",
                Phone = "(555) 567-8901",
                Address = "321 Elm St, Chicago, IL 60601",
                DateOfBirth = new DateTime(1992, 1, 30),
                CountryOfOrigin = "India",
                AssignedAttorneyId = attorneys[1].Id, // Michael Chen
                CreatedBy = "System",
                UpdatedBy = "System"
            },
            new Client
            {
                FirstName = "Carlos",
                LastName = "Silva",
                Email = "carlos.silva@email.com",
                Phone = "(555) 678-9012",
                Address = "654 Maple Dr, Miami, FL 33101",
                DateOfBirth = new DateTime(1987, 9, 12),
                CountryOfOrigin = "Brazil",
                AssignedAttorneyId = attorneys[2].Id, // Maria Rodriguez
                CreatedBy = "System",
                UpdatedBy = "System"
            },
            new Client
            {
                FirstName = "Emma",
                LastName = "Thompson",
                Email = "emma.thompson@email.com",
                Phone = "(555) 789-0123",
                Address = "987 Cedar Ln, Boston, MA 02101",
                DateOfBirth = new DateTime(1983, 5, 18),
                CountryOfOrigin = "Canada",
                AssignedAttorneyId = attorneys[0].Id, // Sarah Johnson
                CreatedBy = "System",
                UpdatedBy = "System"
            }
        };

        _context.Clients.AddRange(clients);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"Seeded {clients.Length} clients.");
    }

    private async Task SeedCasesAsync()
    {
        if (await _context.CannlawCases.AnyAsync())
        {
            _logger.LogInformation("Cases already exist, skipping case seeding.");
            return;
        }

        var clients = await _context.Clients.ToListAsync();
        var cases = new List<CannlawCase>();

        var caseTypes = new[] { "Family-Based Immigration", "Employment-Based Immigration", "Naturalization", "Asylum", "Business Immigration", "Student Visa" };
        var statuses = Enum.GetValues<CaseStatus>();

        for (int i = 0; i < clients.Count; i++)
        {
            var client = clients[i];
            var caseType = caseTypes[i % caseTypes.Length];
            var status = statuses[i % statuses.Length];

            var cannlawCase = new CannlawCase
            {
                ClientId = client.Id,
                CaseType = caseType,
                Status = status,
                Description = $"{caseType} case for {client.FirstName} {client.LastName}",
                StartDate = DateTime.UtcNow.AddDays(-Random.Shared.Next(30, 365)),
                Notes = $"Case notes for {client.FirstName} {client.LastName} - {caseType}",
                GovernmentCaseNumber = status == CaseStatus.InProgress || status == CaseStatus.Paid || status == CaseStatus.FormsCompleted 
                    ? $"MSC{Random.Shared.Next(1000000000, 1999999999)}" : string.Empty
            };

            if (status == CaseStatus.Complete)
            {
                cannlawCase.CompletionDate = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 30));
            }
            else if (status == CaseStatus.ClosedRejected)
            {
                cannlawCase.RejectionReason = "Application denied due to insufficient documentation";
                cannlawCase.CompletionDate = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 60));
            }

            cases.Add(cannlawCase);

            // Add status history
            var statusHistory = new CaseStatusHistory
            {
                Case = cannlawCase,
                FromStatus = CaseStatus.NotStarted,
                ToStatus = status,
                Notes = $"Case status updated to {status}",
                ChangedBy = "System"
            };

            _context.CaseStatusHistories.Add(statusHistory);
        }

        _context.CannlawCases.AddRange(cases);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"Seeded {cases.Count} cases with status history.");
    }

    private async Task SeedTimeEntriesAsync()
    {
        if (await _context.TimeEntries.AnyAsync())
        {
            _logger.LogInformation("Time entries already exist, skipping time entry seeding.");
            return;
        }

        var clients = await _context.Clients.Include(c => c.AssignedAttorney).ToListAsync();
        var timeEntries = new List<TimeEntry>();

        foreach (var client in clients)
        {
            if (client.AssignedAttorney == null) continue;

            // Create 3-5 time entries per client
            var entryCount = Random.Shared.Next(3, 6);
            for (int i = 0; i < entryCount; i++)
            {
                var startTime = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 90)).AddHours(-Random.Shared.Next(1, 8));
                var duration = Random.Shared.Next(1, 8) * 0.1m; // 6-minute increments
                var endTime = startTime.AddHours((double)duration);

                var descriptions = new[]
                {
                    "Initial client consultation and case assessment",
                    "Document review and preparation",
                    "Government form completion and filing",
                    "Client communication and status update",
                    "Legal research and case strategy development",
                    "Court appearance preparation",
                    "Response to government request for evidence"
                };

                var timeEntry = new TimeEntry
                {
                    ClientId = client.Id,
                    AttorneyId = client.AssignedAttorney.Id,
                    StartTime = startTime,
                    EndTime = endTime,
                    Duration = duration,
                    Description = descriptions[Random.Shared.Next(descriptions.Length)],
                    Notes = $"Time entry for {client.FirstName} {client.LastName}",
                    HourlyRate = client.AssignedAttorney.DefaultHourlyRate,
                    BillableAmount = duration * client.AssignedAttorney.DefaultHourlyRate,
                    IsBilled = Random.Shared.Next(0, 2) == 1, // 50% chance of being billed
                    BilledDate = Random.Shared.Next(0, 2) == 1 ? DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 30)) : null
                };

                timeEntries.Add(timeEntry);
            }
        }

        _context.TimeEntries.AddRange(timeEntries);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"Seeded {timeEntries.Count} time entries.");
    }

    private async Task SeedDocumentsAsync()
    {
        if (await _context.Documents.AnyAsync())
        {
            _logger.LogInformation("Documents already exist, skipping document seeding.");
            return;
        }

        var clients = await _context.Clients.ToListAsync();
        var documents = new List<Document>();

        var documentTypes = new[]
        {
            ("Birth Certificate", DocumentCategory.PersonalDocuments),
            ("Passport Copy", DocumentCategory.PersonalDocuments),
            ("Marriage Certificate", DocumentCategory.PersonalDocuments),
            ("I-130 Petition", DocumentCategory.GovernmentForms),
            ("I-485 Application", DocumentCategory.GovernmentForms),
            ("Employment Authorization", DocumentCategory.SupportingEvidence),
            ("Tax Returns", DocumentCategory.SupportingEvidence),
            ("Attorney Correspondence", DocumentCategory.Correspondence),
            ("Legal Brief", DocumentCategory.Legal)
        };

        foreach (var client in clients)
        {
            // Create 2-4 documents per client
            var docCount = Random.Shared.Next(2, 5);
            for (int i = 0; i < docCount; i++)
            {
                var (docName, category) = documentTypes[Random.Shared.Next(documentTypes.Length)];
                
                var document = new Document
                {
                    ClientId = client.Id,
                    FileName = $"{docName.Replace(" ", "_").ToLower()}_{client.Id}_{i + 1}.pdf",
                    OriginalFileName = $"{docName} - {client.FirstName} {client.LastName}.pdf",
                    FileUrl = $"/documents/clients/{client.Id}/{docName.Replace(" ", "_").ToLower()}_{i + 1}.pdf",
                    ContentType = "application/pdf",
                    FileSize = Random.Shared.Next(100000, 5000000), // 100KB to 5MB
                    Category = category,
                    Description = $"{docName} for {client.FirstName} {client.LastName}",
                    UploadedBy = "System",
                    IsConfidential = category == DocumentCategory.Legal || category == DocumentCategory.PersonalDocuments,
                    AccessNotes = category == DocumentCategory.Legal ? "Attorney-client privileged" : string.Empty
                };

                documents.Add(document);
            }
        }

        _context.Documents.AddRange(documents);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"Seeded {documents.Count} documents.");
    }

    private async Task SeedNotificationTemplatesAsync()
    {
        if (await _context.NotificationTemplates.AnyAsync())
        {
            _logger.LogInformation("Notification templates already exist, skipping template seeding.");
            return;
        }

        var templates = new List<NotificationTemplate>
        {
            new NotificationTemplate
            {
                Name = "Client Assignment",
                Type = NotificationType.ClientAssignment,
                SubjectTemplate = "New Client Assignment: {ClientName}",
                BodyTemplate = "You have been assigned a new client: {ClientName}. Please review their case details and begin the intake process.",
                EmailBodyTemplate = "<h2>New Client Assignment</h2><p>Dear Attorney,</p><p>You have been assigned a new client: <strong>{ClientName}</strong>.</p><p>Please log into the system to review their case details and begin the intake process.</p><p>Best regards,<br>Cannlaw System</p>",
                IsActive = true
            },
            new NotificationTemplate
            {
                Name = "Case Status Change",
                Type = NotificationType.CaseStatusChange,
                SubjectTemplate = "Case Status Updated: {CaseName}",
                BodyTemplate = "Case '{CaseName}' status has been changed from {OldStatus} to {NewStatus}.",
                EmailBodyTemplate = "<h2>Case Status Update</h2><p>The status of case <strong>{CaseName}</strong> has been updated:</p><ul><li>Previous Status: {OldStatus}</li><li>New Status: {NewStatus}</li></ul><p>Please review the case for any required actions.</p>",
                IsActive = true
            },
            new NotificationTemplate
            {
                Name = "Billing Threshold Warning",
                Type = NotificationType.BillingThreshold,
                SubjectTemplate = "Billing Threshold Alert - {Period}",
                BodyTemplate = "Your billing for {Period} has reached {CurrentAmount}, approaching the threshold of {Threshold}. Please review your time entries.",
                EmailBodyTemplate = "<h2>Billing Threshold Warning</h2><p>Your billing for <strong>{Period}</strong> has reached <strong>{CurrentAmount}</strong>, approaching the threshold of <strong>{Threshold}</strong>.</p><p>Please review your time entries and ensure all billable hours are properly recorded.</p>",
                IsActive = true
            },
            new NotificationTemplate
            {
                Name = "Deadline Reminder",
                Type = NotificationType.DeadlineReminder,
                SubjectTemplate = "Deadline Reminder: {TaskName}",
                BodyTemplate = "Reminder: '{TaskName}' is due on {Deadline} ({DaysUntil} days remaining).",
                EmailBodyTemplate = "<h2>Deadline Reminder</h2><p>This is a reminder that <strong>{TaskName}</strong> is due on <strong>{Deadline}</strong>.</p><p>Days remaining: <strong>{DaysUntil}</strong></p><p>Please ensure this task is completed on time.</p>",
                IsActive = true
            },
            new NotificationTemplate
            {
                Name = "Document Upload",
                Type = NotificationType.DocumentUpload,
                SubjectTemplate = "New Document: {DocumentName}",
                BodyTemplate = "New document '{DocumentName}' has been uploaded by {ClientName}. Please review when convenient.",
                EmailBodyTemplate = "<h2>New Document Uploaded</h2><p>A new document has been uploaded:</p><ul><li>Document: <strong>{DocumentName}</strong></li><li>Client: <strong>{ClientName}</strong></li></ul><p>Please review the document when convenient.</p>",
                IsActive = true
            },
            new NotificationTemplate
            {
                Name = "Time Entry Reminder",
                Type = NotificationType.TimeEntryReminder,
                SubjectTemplate = "Time Entry Reminder",
                BodyTemplate = "{Message}",
                EmailBodyTemplate = "<h2>Time Entry Reminder</h2><p>{Message}</p><p>Please ensure all billable time is properly recorded in the system.</p>",
                IsActive = true
            },
            new NotificationTemplate
            {
                Name = "System Alert",
                Type = NotificationType.SystemAlert,
                SubjectTemplate = "System Alert",
                BodyTemplate = "System notification: Please check the system for important updates.",
                EmailBodyTemplate = "<h2>System Alert</h2><p>This is a system notification. Please log into the system to check for important updates.</p>",
                IsActive = true
            }
        };

        _context.NotificationTemplates.AddRange(templates);
        await _context.SaveChangesAsync();
        _logger.LogInformation($"Seeded {templates.Count} notification templates.");
    }

    private async Task CreateAdminUserAsync()
    {
        // Check if admin user already exists
        var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "admin@cannlaw.com");
        if (adminUser != null)
        {
            _logger.LogInformation("Admin user already exists, skipping admin user creation.");
            return;
        }

        // Create admin user
        var passwordHasher = new L4H.Infrastructure.Services.PasswordHasher();
        var hashedPassword = passwordHasher.HashPassword("Admin123!");

        var admin = new User
        {
            Id = new L4H.Shared.Models.UserId(Guid.NewGuid()),
            Email = "admin@cannlaw.com",
            PasswordHash = hashedPassword,
            FirstName = "System",
            LastName = "Administrator",
            EmailVerified = true,
            IsActive = true,
            IsStaff = true,
            IsLegalProfessional = false, // Admin is not a legal professional
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(admin);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Created admin user with email: admin@cannlaw.com and password: Admin123!");
    }
}