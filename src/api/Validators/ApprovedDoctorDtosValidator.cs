
using FluentValidation;
using L4H.Shared.Models;

namespace L4H.Api.Validators
{
    public class CreateApprovedDoctorRequestValidator : AbstractValidator<CreateApprovedDoctorRequest>
    {
        private const string ValidCharactersRegex = @"^[\p{L}\p{N}\s\-'.,]+$";

        public CreateApprovedDoctorRequestValidator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(100).Matches(ValidCharactersRegex);
            RuleFor(x => x.Address).NotEmpty().MaximumLength(200).Matches(ValidCharactersRegex);
            RuleFor(x => x.Phone).MaximumLength(20).Matches(ValidCharactersRegex);
            RuleFor(x => x.Email).EmailAddress();
            RuleFor(x => x.City).MaximumLength(100).Matches(ValidCharactersRegex);
            RuleFor(x => x.StateProvince).MaximumLength(100).Matches(ValidCharactersRegex);
            RuleFor(x => x.PostalCode).MaximumLength(20).Matches(ValidCharactersRegex);
            RuleFor(x => x.CountryCode).NotEmpty().Length(2);
            RuleFor(x => x.Website).MaximumLength(200);
            RuleFor(x => x.Specialties).MaximumLength(500);
            RuleFor(x => x.Languages).MaximumLength(500);
            RuleFor(x => x.AcceptedCountryCodes).MaximumLength(500);
            RuleFor(x => x.Notes).MaximumLength(1000);
        }
    }
}
