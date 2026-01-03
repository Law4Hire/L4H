using FluentValidation;
using L4H.Shared.Models;

namespace L4H.Api.Validators;

public class ContactFormRequestValidator : AbstractValidator<ContactFormRequest>
{
    public ContactFormRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .Length(2, 100).WithMessage("Name must be between 2 and 100 characters")
            .Matches(@"^[\p{L}\s.'-]+$").WithMessage("Name contains invalid characters");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email address")
            .MaximumLength(255).WithMessage("Email must not exceed 255 characters");

        RuleFor(x => x.Phone)
            .Matches(@"^[\d\s\-\+\(\)]+$").WithMessage("Phone number contains invalid characters")
            .Length(10, 20).WithMessage("Phone number must be between 10 and 20 characters")
            .When(x => !string.IsNullOrEmpty(x.Phone));

        RuleFor(x => x.Subject)
            .Length(0, 200).WithMessage("Subject must not exceed 200 characters");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Message is required")
            .Length(10, 5000).WithMessage("Message must be between 10 and 5000 characters");

        RuleFor(x => x.ConsultationType)
            .NotEmpty().WithMessage("Consultation type is required")
            .Must(BeValidConsultationType).WithMessage("Invalid consultation type");
    }

    private bool BeValidConsultationType(string consultationType)
    {
        var validTypes = new[] { "general", "visa", "immigration", "citizenship", "family", "business", "employment", "waivers", "other" };
        return validTypes.Contains(consultationType?.ToLowerInvariant());
    }
}
