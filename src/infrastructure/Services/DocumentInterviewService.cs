using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Interfaces;
using L4H.Shared.Models.Dtos;
using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.Services;

public class DocumentInterviewService : IDocumentInterviewService
{
    private readonly L4HDbContext _context;
    private readonly IPdfInjectionService _pdfInjectionService;
    private readonly ILogger<DocumentInterviewService> _logger;
    private readonly HttpClient _httpClient;

    public DocumentInterviewService(
        L4HDbContext context, 
        IPdfInjectionService pdfInjectionService,
        ILogger<DocumentInterviewService> logger,
        HttpClient httpClient)
    {
        _context = context;
        _pdfInjectionService = pdfInjectionService;
        _logger = logger;
        _httpClient = httpClient;
    }

    public async Task<IEnumerable<FormFieldMappingDto>> GetRequiredFieldsAsync(Guid formId)
    {
        return await _context.FormFieldMappings
            .Where(m => m.FormId == formId && m.Status != FormFieldMappingStatus.Ignored)
            .Select(m => new FormFieldMappingDto
            {
                Id = m.Id,
                FormId = m.FormId,
                PdfFieldId = m.PdfFieldId,
                FoxlinDataKey = m.FoxlinDataKey,
                Status = (FormFieldMappingStatusDto)m.Status,
                FieldType = m.FieldType,
                DefaultValue = m.DefaultValue,
                IsReadOnly = m.IsReadOnly,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<byte[]> AssembleDocumentAsync(Guid formId, Dictionary<string, string> answers)
    {
        var form = await _context.USCISForms.FindAsync(formId)
            ?? throw new KeyNotFoundException($"Form {formId} not found.");

        if (string.IsNullOrEmpty(form.FormUrl))
        {
            throw new InvalidOperationException($"Form {form.FormNumber} does not have a template URL.");
        }

        _logger.LogInformation("Assembling document for form {FormNumber} ({FormId})", form.FormNumber, formId);

        // Fetch the template bytes
        byte[] templateBytes;
        try
        {
            templateBytes = await _httpClient.GetByteArrayAsync(form.FormUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download PDF template from {Url}", form.FormUrl);
            throw new Exception("Failed to retrieve PDF template.", ex);
        }

        // Inject answers
        return _pdfInjectionService.InjectAnswers(templateBytes, answers);
    }
}
