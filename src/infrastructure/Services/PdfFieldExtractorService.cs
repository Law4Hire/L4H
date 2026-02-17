using iText.Forms;
using iText.Kernel.Pdf;
using L4H.Infrastructure.Interfaces;
using L4H.Shared.Models.Dtos;
using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.Services;

public class PdfFieldExtractorService : IPdfFieldExtractor
{
    private readonly ILogger<PdfFieldExtractorService> _logger;

    public PdfFieldExtractorService(ILogger<PdfFieldExtractorService> logger)
    {
        _logger = logger;
    }

    public IEnumerable<PdfFieldManifestDto> ExtractFields(byte[] pdfBytes)
    {
        if (pdfBytes == null || pdfBytes.Length == 0)
        {
            _logger.LogWarning("ExtractFields called with null or empty byte array.");
            return Enumerable.Empty<PdfFieldManifestDto>();
        }

        var manifests = new List<PdfFieldManifestDto>();

        try
        {
            using var ms = new MemoryStream(pdfBytes);
            using var reader = new PdfReader(ms);
            using var pdfDocument = new PdfDocument(reader);
            var form = PdfAcroForm.GetAcroForm(pdfDocument, false);

            if (form == null)
            {
                _logger.LogInformation("No AcroForm found in the provided PDF.");
                return manifests;
            }

            var fields = form.GetAllFormFields();
            _logger.LogInformation("Discovered {Count} fields in PDF.", fields.Count);

            foreach (var fieldEntry in fields)
            {
                var fieldName = fieldEntry.Key;
                var field = fieldEntry.Value;

                var manifest = new PdfFieldManifestDto
                {
                    FieldId = fieldName,
                    FieldType = field.GetFormType()?.ToString() ?? "Unknown",
                    DefaultValue = field.GetValueAsString(),
                    IsReadOnly = field.IsReadOnly(),
                    IsRequired = field.IsRequired()
                };

                // Handle options for choice fields (dropdowns/radios)
                if (field.GetFormType()?.ToString() == "/Btn" || field.GetFormType()?.ToString() == "/Ch")
                {
                    // Basic option extraction could be expanded here if needed
                }

                manifests.Add(manifest);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during PDF field extraction.");
            throw;
        }

        return manifests;
    }
}
