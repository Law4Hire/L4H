using L4H.Shared.Models.Dtos;

namespace L4H.Infrastructure.Interfaces;

public interface IDocumentInterviewService
{
    /// <summary>
    /// Gets all mapped fields for a specific USCIS form that require user input.
    /// </summary>
    Task<IEnumerable<FormFieldMappingDto>> GetRequiredFieldsAsync(Guid formId);

    /// <summary>
    /// Generates a completed and flattened PDF based on the provided answers.
    /// </summary>
    Task<byte[]> AssembleDocumentAsync(Guid formId, Dictionary<string, string> answers);
}
