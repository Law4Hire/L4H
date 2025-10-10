
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
        }
    }
}
