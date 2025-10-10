
using FluentValidation;
using L4H.Shared.Models;

namespace L4H.Api.Validators
{
    public class CreateWorkflowRequestValidator : AbstractValidator<CreateWorkflowRequest>
    {
        public CreateWorkflowRequestValidator()
        {
            RuleFor(x => x.VisaType).NotEmpty().MaximumLength(100);
            RuleFor(x => x.CountryCode).NotEmpty().Length(2);
            RuleFor(x => x.Source).MaximumLength(200);
            RuleFor(x => x.Notes).MaximumLength(1000);
        }
    }

    public class CreateWorkflowStepRequestValidator : AbstractValidator<CreateWorkflowStepRequest>
    {
        public CreateWorkflowStepRequestValidator()
        {
            RuleFor(x => x.CountryCode).NotEmpty().Length(2);
            RuleFor(x => x.VisaType).NotEmpty().MaximumLength(100);
            RuleFor(x => x.Key).MaximumLength(100);
            RuleFor(x => x.Title).MaximumLength(200);
            RuleFor(x => x.Description).MaximumLength(1000);
            RuleFor(x => x.DocumentType).MaximumLength(100);
            RuleFor(x => x.DocumentName).MaximumLength(200);
            RuleFor(x => x.GovernmentLink).MaximumLength(500);
        }
    }

    public class CreateWorkflowDoctorRequestValidator : AbstractValidator<CreateWorkflowDoctorRequest>
    {
        private const string ValidCharactersRegex = @"^[\p{L}\p{N}\s\-'.,]+$";

        public CreateWorkflowDoctorRequestValidator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(100).Matches(ValidCharactersRegex);
            RuleFor(x => x.Address).NotEmpty().MaximumLength(200).Matches(ValidCharactersRegex);
            RuleFor(x => x.Phone).MaximumLength(20).Matches(ValidCharactersRegex);
            RuleFor(x => x.City).NotEmpty().MaximumLength(100).Matches(ValidCharactersRegex);
            RuleFor(x => x.CountryCode).NotEmpty().Length(2);
            RuleFor(x => x.SourceUrl).MaximumLength(200);
        }
    }
}
