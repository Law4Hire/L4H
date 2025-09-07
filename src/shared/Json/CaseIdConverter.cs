using System.Text.Json;
using System.Text.Json.Serialization;
using L4H.Shared.Models;

namespace L4H.Shared.Json;

public class CaseIdConverter : JsonConverter<CaseId>
{
    public override CaseId Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var guidString = reader.GetString();
        if (Guid.TryParse(guidString, out var guid))
        {
            return new CaseId(guid);
        }
        throw new JsonException($"Unable to convert \"{guidString}\" to CaseId.");
    }

    public override void Write(Utf8JsonWriter writer, CaseId value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.Value.ToString());
    }
}