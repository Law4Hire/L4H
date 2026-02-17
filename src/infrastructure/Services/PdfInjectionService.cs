using iText.Forms;
using iText.Kernel.Pdf;
using L4H.Infrastructure.Interfaces;
using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.Services;

public class PdfInjectionService : IPdfInjectionService
{
    private readonly ILogger<PdfInjectionService> _logger;

    public PdfInjectionService(ILogger<PdfInjectionService> logger)
    {
        _logger = logger;
    }

    public byte[] InjectAnswers(byte[] template, Dictionary<string, string> answers)
    {
        if (template == null || template.Length == 0)
        {
            _logger.LogWarning("InjectAnswers called with null or empty template.");
            return Array.Empty<byte>();
        }

        try
        {
            using var readerStream = new MemoryStream(template);
            using var writerStream = new MemoryStream();
            
            using (var reader = new PdfReader(readerStream))
            {
                using (var pdfDocument = new PdfDocument(reader, new PdfWriter(writerStream)))
                {
                    var form = PdfAcroForm.GetAcroForm(pdfDocument, true);
                    if (form == null)
                    {
                        _logger.LogWarning("No AcroForm found in the PDF template.");
                        return template; // Return original if no form exists
                    }

                    var fields = form.GetAllFormFields();
                    foreach (var answer in answers)
                    {
                        if (fields.TryGetValue(answer.Key, out var field))
                        {
                            _logger.LogDebug("Injecting value for field {FieldId}", answer.Key);
                            
                            // Handle Checkbox Logic: Mapping 'True' to the specific PDF 'Yes' value (usually 'Yes' or 'On')
                            if (field.GetFormType()?.ToString() == "/Btn")
                            {
                                if (bool.TryParse(answer.Value, out var boolValue))
                                {
                                    if (boolValue)
                                    {
                                        field.SetValue("Yes", true); // iText7 will try to find the 'Yes' equivalent state
                                    }
                                    else
                                    {
                                        field.SetValue("Off", true);
                                    }
                                    continue;
                                }
                            }

                            field.SetValue(answer.Value ?? string.Empty);
                        }
                        else
                        {
                            _logger.LogWarning("Field {FieldId} from answers not found in PDF template.", answer.Key);
                        }
                    }

                    // Flatten the PDF (non-editable)
                    form.FlattenFields();
                }
            }

            return writerStream.ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during PDF answer injection.");
            throw;
        }
    }
}
