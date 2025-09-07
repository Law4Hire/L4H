using System.Net;
using System.Text.Json;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using L4H.Api.Tests.TestHelpers;

namespace L4H.Api.Tests.Controllers;

public sealed class SchedulingControllerTests : IDisposable
{
    private readonly L4HDbContext _context;
    private readonly UserId _testClientUserId = new(Guid.NewGuid());
    private readonly UserId _testStaffUserId = new(Guid.NewGuid());
    private readonly CaseId _testCaseId = new(Guid.NewGuid());
    private readonly string _testDatabaseName;
    private int _testVisaTypeId;

    public SchedulingControllerTests()
    {
        _testDatabaseName = $"L4H_Test_{Guid.NewGuid():N}";
        
        var options = new DbContextOptionsBuilder<L4HDbContext>()
            .UseInMemoryDatabase(_testDatabaseName)
            .Options;

        _context = new L4HDbContext(options);
        _context.Database.EnsureCreated();
        
        SeedTestData().Wait();
    }

    private async Task SeedTestData()
    {
        // Create test client user
        var clientUser = new User
        {
            Id = _testClientUserId,
            Email = "client@example.com",
            PasswordHash = "hash",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow,
            IsAdmin = false,
            FailedLoginCount = 0
        };
        _context.Users.Add(clientUser);

        // Create test staff user
        var staffUser = new User
        {
            Id = _testStaffUserId,
            Email = "staff@example.com",
            PasswordHash = "hash",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow,
            IsAdmin = true,
            FailedLoginCount = 0
        };
        _context.Users.Add(staffUser);

        // Create visa type
        var visaType = new VisaType
        {
            Code = "H1B",
            Name = "Specialty Occupation",
            IsActive = true
        };
        _context.VisaTypes.Add(visaType);

        await _context.SaveChangesAsync();
        _testVisaTypeId = visaType.Id;

        // Create test case
        var testCase = new Case
        {
            Id = _testCaseId,
            UserId = _testClientUserId,
            Status = "active",
            VisaTypeId = _testVisaTypeId,
            CreatedAt = DateTime.UtcNow,
            IsInterviewLocked = false
        };
        _context.Cases.Add(testCase);

        // Create admin settings
        var bufferSetting = new AdminSettings
        {
            Key = "APPOINTMENT_BUFFER_MINUTES",
            Value = "30",
            Description = "Buffer time between appointments",
            UpdatedAt = DateTime.UtcNow
        };
        _context.AdminSettings.Add(bufferSetting);

        await _context.SaveChangesAsync();
    }

    [Fact]
    public async Task CreateAppointment_WithValidData_CreatesAppointmentSuccessfully()
    {
        // Arrange
        var startTime = DateTime.UtcNow.AddDays(1).AddHours(10); // Tomorrow at 10 AM UTC
        
        var appointment = new Appointment
        {
            CaseId = _testCaseId,
            StaffId = _testStaffUserId,
            StartTime = startTime,
            DurationMinutes = 60,
            TimeZone = "UTC",
            TimezoneOffsetMinutes = 0,
            Status = "scheduled",
            Notes = "Initial consultation",
            CreatedAt = DateTime.UtcNow
        };

        // Act
        _context.Appointments.Add(appointment);

        // Lock interview for the case (per specification)
        var caseEntity = await _context.Cases.FindAsync(_testCaseId);
        caseEntity!.IsInterviewLocked = true;

        await _context.SaveChangesAsync();

        // Assert
        var savedAppointment = await _context.Appointments.FindAsync(appointment.Id);
        var updatedCase = await _context.Cases.FindAsync(_testCaseId);

        Assert.NotNull(savedAppointment);
        Assert.Equal("scheduled", savedAppointment.Status);
        Assert.Equal(_testCaseId, savedAppointment.CaseId);
        Assert.Equal(_testStaffUserId, savedAppointment.StaffUserId);
        Assert.Equal(60, (int)(savedAppointment.ScheduledEnd - savedAppointment.ScheduledStart).TotalMinutes);
        Assert.True(updatedCase!.IsInterviewLocked);
    }

    [Fact]
    public async Task CreateAppointment_WhenExistingActiveAppointmentExists_ShouldPreventCreation()
    {
        // Arrange - Create existing appointment
        var existingAppointment = new Appointment
        {
            CaseId = _testCaseId,
            StaffId = _testStaffUserId,
            StartTime = DateTime.UtcNow.AddDays(1),
            DurationMinutes = 60,
            TimeZone = "UTC",
            Status = "scheduled"
        };

        _context.Appointments.Add(existingAppointment);
        await _context.SaveChangesAsync();

        // Act - Try to create another appointment
        var duplicateCheck = await _context.Appointments
            .FirstOrDefaultAsync(a => a.CaseId == _testCaseId && 
                                     (a.Status == "scheduled" || a.Status == "confirmed"));

        // Assert
        Assert.NotNull(duplicateCheck);
        Assert.Equal(existingAppointment.Id, duplicateCheck.Id);
    }

    [Fact]
    public async Task SchedulingConflictDetection_WithOverlappingAppointments_DetectsConflict()
    {
        // Arrange
        var baseTime = DateTime.UtcNow.AddDays(1).AddHours(10);
        
        // Existing appointment from 10:00-11:00
        var existingAppointment = new Appointment
        {
            CaseId = _testCaseId,
            StaffId = _testStaffUserId,
            StartTime = baseTime,
            DurationMinutes = 60,
            Status = "scheduled"
        };

        _context.Appointments.Add(existingAppointment);
        await _context.SaveChangesAsync();

        // Act - Check for conflict with appointment from 10:30-11:30 (overlaps)
        var conflictStartTime = baseTime.AddMinutes(30);
        var conflictEndTime = conflictStartTime.AddMinutes(60);

        var hasConflict = await _context.Appointments
            .Where(a => a.StaffUserId == _testStaffUserId &&
                       a.Status != "cancelled" &&
                       a.ScheduledStart < conflictEndTime &&
                       a.ScheduledEnd > conflictStartTime)
            .AnyAsync();

        // Assert
        Assert.True(hasConflict);
    }

    [Fact]
    public async Task AppointmentBuffer_WithThirtyMinuteBuffer_PreventsTooCloseBooking()
    {
        // Arrange
        var baseTime = DateTime.UtcNow.AddDays(1).AddHours(10);
        var bufferMinutes = 30;
        
        // Existing appointment from 10:00-11:00
        var existingAppointment = new Appointment
        {
            CaseId = _testCaseId,
            StaffId = _testStaffUserId,
            StartTime = baseTime,
            DurationMinutes = 60,
            Status = "scheduled"
        };

        _context.Appointments.Add(existingAppointment);
        await _context.SaveChangesAsync();

        // Act - Check for conflict with 30-minute buffer
        // Trying to book from 11:15-12:15 (only 15 minutes after existing appointment ends)
        var newStartTime = baseTime.AddMinutes(75); // 11:15 AM
        var newEndTime = newStartTime.AddMinutes(60);

        // Check conflict including buffer
        var hasConflictWithBuffer = await _context.Appointments
            .Where(a => a.StaffUserId == _testStaffUserId &&
                       a.Status != "cancelled" &&
                       a.ScheduledStart.AddMinutes(-bufferMinutes) < newEndTime &&
                       a.ScheduledEnd.AddMinutes(bufferMinutes) > newStartTime)
            .AnyAsync();

        // Assert
        Assert.True(hasConflictWithBuffer); // Should conflict due to buffer
    }

    [Fact]
    public async Task RescheduleProposal_WithValidData_CreatesProposal()
    {
        // Arrange
        var baseTime = DateTime.UtcNow.AddDays(1).AddHours(10);
        
        var appointment = new Appointment
        {
            CaseId = _testCaseId,
            StaffId = _testStaffUserId,
            StartTime = baseTime,
            DurationMinutes = 60,
            Status = "scheduled"
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        var proposal = new RescheduleProposal
        {
            AppointmentId = appointment.Id,
            InitiatedBy = "client",
            Status = "pending",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(2),
            Option1StartTime = baseTime.AddDays(1),
            Option2StartTime = baseTime.AddDays(1).AddHours(2),
            Option3StartTime = baseTime.AddDays(2),
            DurationMinutes = 60,
            TimeZone = "UTC",
            TimezoneOffsetMinutes = 0
        };

        // Act
        _context.RescheduleProposals.Add(proposal);
        appointment.Status = "rescheduling";
        await _context.SaveChangesAsync();

        // Assert
        var savedProposal = await _context.RescheduleProposals
            .Include(p => p.Appointment)
            .FirstOrDefaultAsync(p => p.Id == proposal.Id);

        Assert.NotNull(savedProposal);
        Assert.Equal("pending", savedProposal.Status);
        Assert.Equal("client", savedProposal.InitiatedBy);
        Assert.Equal("rescheduling", savedProposal.Appointment.Status);
        Assert.True(savedProposal.ExpiresAt > DateTime.UtcNow.AddHours(47)); // Almost 2 days
    }

    [Fact]
    public async Task RescheduleLimit_TwoReschedulesPerSide_EnforcesLimit()
    {
        // Arrange
        var appointment = new Appointment
        {
            CaseId = _testCaseId,
            StaffId = _testStaffUserId,
            StartTime = DateTime.UtcNow.AddDays(1),
            DurationMinutes = 60,
            Status = "scheduled"
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        // Create two existing reschedule proposals by client
        var proposal1 = new RescheduleProposal
        {
            AppointmentId = appointment.Id,
            InitiatedBy = "client",
            Status = "rejected",
            CreatedAt = DateTime.UtcNow.AddDays(-3),
            ExpiresAt = DateTime.UtcNow.AddDays(-1),
            Option1StartTime = DateTime.UtcNow.AddDays(2),
            Option2StartTime = DateTime.UtcNow.AddDays(2).AddHours(1),
            Option3StartTime = DateTime.UtcNow.AddDays(2).AddHours(2),
            DurationMinutes = 60
        };

        var proposal2 = new RescheduleProposal
        {
            AppointmentId = appointment.Id,
            InitiatedBy = "client",
            Status = "rejected",
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            ExpiresAt = DateTime.UtcNow,
            Option1StartTime = DateTime.UtcNow.AddDays(3),
            Option2StartTime = DateTime.UtcNow.AddDays(3).AddHours(1),
            Option3StartTime = DateTime.UtcNow.AddDays(3).AddHours(2),
            DurationMinutes = 60
        };

        _context.RescheduleProposals.AddRange(proposal1, proposal2);
        await _context.SaveChangesAsync();

        // Act - Check reschedule count
        var rescheduleCount = await _context.RescheduleProposals
            .Where(r => r.AppointmentId == appointment.Id && r.InitiatedBy == "client")
            .CountAsync();

        // Assert
        Assert.Equal(2, rescheduleCount); // Limit reached
    }

    [Fact]
    public async Task ChooseRescheduleOption_WithValidChoice_UpdatesAppointment()
    {
        // Arrange
        var originalTime = DateTime.UtcNow.AddDays(1);
        var newTime = DateTime.UtcNow.AddDays(2);
        
        var appointment = new Appointment
        {
            CaseId = _testCaseId,
            StaffId = _testStaffUserId,
            StartTime = originalTime,
            DurationMinutes = 60,
            Status = "rescheduling"
        };

        var proposal = new RescheduleProposal
        {
            AppointmentId = appointment.Id,
            InitiatedBy = "client",
            Status = "pending",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(2),
            Option1StartTime = newTime,
            Option2StartTime = newTime.AddHours(1),
            Option3StartTime = newTime.AddHours(2),
            DurationMinutes = 60,
            TimeZone = "UTC"
        };

        _context.Appointments.Add(appointment);
        _context.RescheduleProposals.Add(proposal);
        await _context.SaveChangesAsync();

        // Act - Accept option 1
        proposal.Status = "accepted";
        proposal.ChosenOption = 1;
        proposal.RespondedAt = DateTime.UtcNow;

        appointment.ScheduledStart = proposal.Option1StartTime;
        appointment.ScheduledEnd = proposal.Option1StartTime.AddMinutes(60);
        appointment.Status = "scheduled";

        await _context.SaveChangesAsync();

        // Assert
        var updatedAppointment = await _context.Appointments.FindAsync(appointment.Id);
        var updatedProposal = await _context.RescheduleProposals.FindAsync(proposal.Id);

        Assert.NotNull(updatedAppointment);
        Assert.Equal(newTime, updatedAppointment.ScheduledStart);
        Assert.Equal("scheduled", updatedAppointment.Status);
        Assert.NotNull(updatedProposal);
        Assert.Equal("accepted", updatedProposal.Status);
        Assert.Equal(1, updatedProposal.ChosenOption);
        Assert.NotNull(updatedProposal.RespondedAt);
    }

    [Fact]
    public void RescheduleProposal_ExpiresAfterTwoDays()
    {
        // Arrange
        var proposal = new RescheduleProposal
        {
            AppointmentId = Guid.NewGuid(),
            InitiatedBy = "client",
            Status = "pending",
            CreatedAt = DateTime.UtcNow.AddDays(-3),
            ExpiresAt = DateTime.UtcNow.AddDays(-1), // Expired 1 day ago
            Option1StartTime = DateTime.UtcNow.AddDays(1),
            Option2StartTime = DateTime.UtcNow.AddDays(1).AddHours(1),
            Option3StartTime = DateTime.UtcNow.AddDays(1).AddHours(2),
            DurationMinutes = 60
        };

        // Act
        var isExpired = proposal.ExpiresAt < DateTime.UtcNow;

        // Assert
        Assert.True(isExpired);
    }

    [Fact]
    public async Task CancelAppointment_RemovesInterviewLock()
    {
        // Arrange
        var appointment = new Appointment
        {
            CaseId = _testCaseId,
            StaffId = _testStaffUserId,
            StartTime = DateTime.UtcNow.AddDays(1),
            DurationMinutes = 60,
            Status = "scheduled"
        };

        _context.Appointments.Add(appointment);

        var caseEntity = await _context.Cases.FindAsync(_testCaseId);
        caseEntity!.IsInterviewLocked = true;

        await _context.SaveChangesAsync();

        // Act - Cancel appointment
        appointment.Status = "cancelled";
        appointment.CancelledAt = DateTime.UtcNow;
        appointment.CancellationReason = "Client request";

        caseEntity.IsInterviewLocked = false;

        await _context.SaveChangesAsync();

        // Assert
        var updatedAppointment = await _context.Appointments.FindAsync(appointment.Id);
        var updatedCase = await _context.Cases.FindAsync(_testCaseId);

        Assert.NotNull(updatedAppointment);
        Assert.Equal("cancelled", updatedAppointment.Status);
        Assert.NotNull(updatedAppointment.CancelledAt);
        Assert.Equal("Client request", updatedAppointment.CancellationReason);
        Assert.NotNull(updatedCase);
        Assert.False(updatedCase.IsInterviewLocked);
    }

    [Fact]
    public async Task AppointmentHistory_ReturnsUserAppointments()
    {
        // Arrange
        var appointment1 = new Appointment
        {
            CaseId = _testCaseId,
            StaffId = _testStaffUserId,
            StartTime = DateTime.UtcNow.AddDays(-2),
            DurationMinutes = 60,
            Status = "completed",
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            CompletedAt = DateTime.UtcNow.AddDays(-2)
        };

        var appointment2 = new Appointment
        {
            CaseId = _testCaseId,
            StaffId = _testStaffUserId,
            StartTime = DateTime.UtcNow.AddDays(1),
            DurationMinutes = 60,
            Status = "scheduled",
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };

        _context.Appointments.AddRange(appointment1, appointment2);
        await _context.SaveChangesAsync();

        // Act
        var userAppointments = await _context.Appointments
            .Include(a => a.Case)
            .Include(a => a.Staff)
            .Where(a => a.Case.UserId == _testClientUserId)
            .OrderByDescending(a => a.ScheduledStart)
            .ToListAsync();

        // Assert
        Assert.Equal(2, userAppointments.Count);
        Assert.Equal("scheduled", userAppointments[0].Status); // Future appointment first
        Assert.Equal("completed", userAppointments[1].Status);
        Assert.All(userAppointments, a => Assert.Equal(_testClientUserId, a.Case.UserId));
    }

    [Fact]
    public async Task TimezoneHandling_StoresCorrectOffsetAndTimezone()
    {
        // Arrange
        var startTime = new DateTime(2024, 6, 15, 14, 0, 0, DateTimeKind.Utc); // 2 PM UTC
        var timezone = "America/New_York"; // EST/EDT
        var offsetMinutes = -240; // EDT is UTC-4 in summer

        var appointment = new Appointment
        {
            CaseId = _testCaseId,
            StaffId = _testStaffUserId,
            StartTime = startTime,
            DurationMinutes = 60,
            TimeZone = timezone,
            TimezoneOffsetMinutes = offsetMinutes,
            Status = "scheduled"
        };

        // Act
        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        // Assert
        var savedAppointment = await _context.Appointments.FindAsync(appointment.Id);
        Assert.NotNull(savedAppointment);
        Assert.Equal(timezone, savedAppointment.TimeZone);
        Assert.Equal(offsetMinutes, savedAppointment.TimezoneOffsetMinutes);
        Assert.Equal(startTime, savedAppointment.ScheduledStart); // Stored in UTC
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    private void Dispose(bool disposing)
    {
        if (disposing)
        {
            _context?.Dispose();
        }
    }
}