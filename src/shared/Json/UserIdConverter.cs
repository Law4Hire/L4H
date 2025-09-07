using System.Text.Json;
using System.Text.Json.Serialization;
using L4H.Shared.Models;

namespace L4H.Shared.Json;

public class UserIdConverter : JsonConverter<UserId>
{
    public override UserId Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var guidString = reader.GetString();
        if (Guid.TryParse(guidString, out var guid))
        {
            return new UserId(guid);
        }
        throw new JsonException($"Unable to convert \"{guidString}\" to UserId.");
    }

    public override void Write(Utf8JsonWriter writer, UserId value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.Value.ToString());
    }
}