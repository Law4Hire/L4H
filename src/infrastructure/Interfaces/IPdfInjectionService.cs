namespace L4H.Infrastructure.Interfaces;

public interface IPdfInjectionService
{
    /// <summary>
    /// Injects a dictionary of answers into a PDF template and returns the flattened (non-editable) result.
    /// </summary>
    /// <param name="template">The raw bytes of the PDF template.</param>
    /// <param name="answers">A dictionary where the key is the PdfFieldId and the value is the data to inject.</param>
    /// <returns>A flattened PDF byte array.</returns>
    byte[] InjectAnswers(byte[] template, Dictionary<string, string> answers);
}
