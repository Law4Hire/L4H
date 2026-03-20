
using FluentValidation;
using L4H.Shared.Models;

namespace L4H.Api.Validators
{
    public class SignupRequestValidator : AbstractValidator<SignupRequest>
    {
        public SignupRequestValidator()
        {
            RuleFor(x => x.Email).NotEmpty().EmailAddress();
            RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
            RuleFor(x => x.FirstName).NotEmpty().Length(1, 100).Matches(@"^[\p{L} .'-]+$");
            RuleFor(x => x.LastName).NotEmpty().Length(1, 100).Matches(@"^[\p{L} .'-]+$");
            RuleFor(x => x.PhoneNumber)
                .Must(phone => string.IsNullOrWhiteSpace(phone) || phone.Length >= 10)
                .WithMessage("Phone number must be at least 10 characters when provided.");
        }
    }
}
