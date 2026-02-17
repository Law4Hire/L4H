using L4H.Shared.Models.Dtos;

namespace L4H.Infrastructure.Interfaces;

public interface IPdfFieldExtractor
{
    /// <summary>
    /// Extracts all fillable AcroForm fields from a PDF byte array.
    /// </summary>
    /// <param name="pdfBytes">The raw bytes of the PDF file.</param>
    /// <returns>A list of field manifests containing metadata for each discovered field.</returns>
    IEnumerable<PdfFieldManifestDto> ExtractFields(byte[] pdfBytes);
}
