namespace L4H.Shared.Models;

public class VisaChangeProposalRequest
{
    public CaseId CaseId { get; set; }
    public int NewVisaTypeId { get; set; }
    public string? Notes { get; set; }
}

public class VisaChangeProposalResponse
{
    public Guid Id { get; set; }
    public CaseId CaseId { get; set; }
    public string OldVisaType { get; set; } = string.Empty;
    public string NewVisaType { get; set; } = string.Empty;
    public decimal DeltaAmount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string? Notes { get; set; }
    public VisaChangePriceBreakdown? Breakdown { get; set; }
}

public class VisaChangePriceBreakdown
{
    public decimal OldPrice { get; set; }
    public decimal NewPrice { get; set; }
    public decimal Delta { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string OldVisaTypeCode { get; set; } = string.Empty;
    public string NewVisaTypeCode { get; set; } = string.Empty;
    public string PackageCode { get; set; } = string.Empty;
    public DateTime CalculatedAt { get; set; }
}

public class VisaChangeApprovalRequest
{
    public Guid RequestId { get; set; }
    public bool Approved { get; set; }
    public string? RejectionReason { get; set; }
}

public class VisaChangeApprovalResponse
{
    public Guid RequestId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? ProcessedAt { get; set; }
    public string? Message { get; set; }
}

public class VisaChangeHistoryResponse
{
    public List<VisaChangeRequestSummary> Requests { get; set; } = new List<VisaChangeRequestSummary>();
}

public class VisaChangeRequestSummary
{
    public Guid Id { get; set; }
    public string OldVisaType { get; set; } = string.Empty;
    public string NewVisaType { get; set; } = string.Empty;
    public decimal DeltaAmount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string RequestedBy { get; set; } = string.Empty;
}