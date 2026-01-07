using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class TimeEntry
{
    public int Id { get; set; }
    
    public CaseId CaseId { get; set; }
    public Case Case { get; set; } = null!;

    public int ClientId { get; set; }
    public Client Client { get; set; } = null!;
    
    public int AttorneyId { get; set; }
    public Attorney Attorney { get; set; } = null!;
    
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    
    /// <summary>
    /// Duration in hours, rounded to 6-minute increments (0.1 hour billing units)
    /// </summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal Duration { get; set; }
    
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string Notes { get; set; } = string.Empty;
    
    // Billing
    [Column(TypeName = "decimal(10,2)")]
    public decimal HourlyRate { get; set; }
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal BillableAmount { get; set; }

    public bool IsBilled { get; set; }
    public DateTime? BilledDate { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Validates and rounds duration to 6-minute increments (0.1 hour)
    /// </summary>
    public void RoundDurationToSixMinuteIncrements(bool roundUp = false)
    {
        // Convert to 6-minute increments (0.1 hour units)
        var totalMinutes = (EndTime - StartTime).TotalMinutes;
        
        // If duration is less than 6 minutes and not rounding up, it might be 0
        // User requirement: "Billing does not begin until ... 5 minutes 59 is passed." 
        // 5m 59s = 5.98 mins. Floor(5.98/6) = 0. Correct.
        
        double sixMinuteIncrements;
        if (roundUp)
        {
            sixMinuteIncrements = Math.Ceiling(totalMinutes / 6.0);
        }
        else
        {
            sixMinuteIncrements = Math.Floor(totalMinutes / 6.0);
        }

        Duration = (decimal)(sixMinuteIncrements * 0.1);
        
        // Calculate billable amount
        BillableAmount = Duration * HourlyRate;
    }
}