
using FluentValidation;
using L4H.Shared.Models;
using System.Text.RegularExpressions;

namespace L4H.Api.Validators
{
    public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
    {
        // Regex to allow letters (including international), numbers, spaces, and common punctuation.
        private const string ValidCharactersRegex = @"^[\p{L}\p{N}\s\-'.,]+$";

        public UpdateProfileRequestValidator()
        {
            RuleFor(x => x.PhoneNumber).MaximumLength(20).Matches(ValidCharactersRegex).When(x => !string.IsNullOrEmpty(x.PhoneNumber));
            RuleFor(x => x.StreetAddress).MaximumLength(100).Matches(ValidCharactersRegex).When(x => !string.IsNullOrEmpty(x.StreetAddress));
            RuleFor(x => x.City).MaximumLength(50).Matches(ValidCharactersRegex).When(x => !string.IsNullOrEmpty(x.City));
            RuleFor(x => x.StateProvince).MaximumLength(50).Matches(ValidCharactersRegex).When(x => !string.IsNullOrEmpty(x.StateProvince));
            RuleFor(x => x.PostalCode).MaximumLength(20).Matches(ValidCharactersRegex).When(x => !string.IsNullOrEmpty(x.PostalCode));
            RuleFor(x => x.Country).Length(2).When(x => !string.IsNullOrEmpty(x.Country));
            RuleFor(x => x.Nationality).Length(2).When(x => !string.IsNullOrEmpty(x.Nationality));
            RuleFor(x => x.Gender).MaximumLength(20).Matches(ValidCharactersRegex).When(x => !string.IsNullOrEmpty(x.Gender));
        }
    }
}
