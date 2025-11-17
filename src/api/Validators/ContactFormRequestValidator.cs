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
            .NotEmpty().WithMessage("Phone number is required")
            .Matches(@"^[\d\s\-\+\(\)]+$").WithMessage("Phone number contains invalid characters")
            .Length(10, 20).WithMessage("Phone number must be between 10 and 20 characters");

        RuleFor(x => x.Subject)
            .NotEmpty().WithMessage("Subject is required")
            .Length(5, 200).WithMessage("Subject must be between 5 and 200 characters");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Message is required")
            .Length(20, 5000).WithMessage("Message must be between 20 and 5000 characters");

        RuleFor(x => x.ConsultationType)
            .NotEmpty().WithMessage("Consultation type is required")
            .Must(BeValidConsultationType).WithMessage("Invalid consultation type");
    }

    private bool BeValidConsultationType(string consultationType)
    {
        var validTypes = new[] { "general", "visa", "immigration", "citizenship", "family", "business", "other" };
        return validTypes.Contains(consultationType?.ToLowerInvariant());
    }
}
