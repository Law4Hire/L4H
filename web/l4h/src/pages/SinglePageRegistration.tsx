import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input, useToast, auth } from '@l4h/shared-ui';
import { interview } from '@l4h/shared-ui';
import { useNavigate, useLocation } from 'react-router-dom';

const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(10, "A valid phone number is required"),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date of birth"),
  countryOfCitizenship: z.string().min(1, "Country of citizenship is required"),
  // Add other fields as necessary from the GITHUB_ISSUES.md
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

const SinglePageRegistration: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { error: showError, success: showSuccess } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
  });

  const sessionToken = location.state?.sessionToken;

  const [showSignupPrompt, setShowSignupPrompt] = React.useState(false);

  const onSubmit = async (data: RegistrationFormValues) => {
    try {
      if (sessionToken) {
        // Register with interview session link
        await interview.registerWithInterview({
          anonymousToken: sessionToken,
          ...data,
        });
      } else {
        // General signup
        await auth.signup({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          // Other fields if supported by backend signup DTO
        });
      }

      showSuccess("Registration successful!");
      setShowSignupPrompt(true);
    } catch (err: any) {
      showError(err.message || "Registration failed. Please try again.");
    }
  };

  const handleProceedToPurchase = () => {
    // Navigate to Law4Hire pricing page to select a consultation package
    navigate('/pricing');
  };

  const handleSkipPurchase = () => {
    navigate('/dashboard');
  };

  if (showSignupPrompt) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Account Created Successfully!</h1>
            <p className="text-xl text-gray-600 mb-8">
              Would you like to purchase a consultation package to get started with your visa application?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleSkipPurchase} variant="secondary" size="lg">
                Not Now
              </Button>
              <Button onClick={handleProceedToPurchase} size="lg">
                View Packages
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Create Your Account</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Personal Information */}
          <div className="md:col-span-2 font-bold text-xl mb-2">Personal Information</div>
          <Input label="First Name" {...register("firstName")} error={errors.firstName?.message} />
          <Input label="Last Name" {...register("lastName")} error={errors.lastName?.message} />
          <Input label="Email Address" type="email" {...register("email")} error={errors.email?.message} />
          <Input label="Password" type="password" {...register("password")} error={errors.password?.message} />
          <Input label="Date of Birth" type="date" {...register("dob")} error={errors.dob?.message} />
          <Input label="Country of Citizenship" {...register("countryOfCitizenship")} error={errors.countryOfCitizenship?.message} />
          <Input label="Phone Number" type="tel" {...register("phone")} error={errors.phone?.message} />

          {/* More fields to be added here based on GITHUB_ISSUES.md */}

          <div className="md:col-span-2 mt-6">
            <Button type="submit" disabled={isSubmitting} loading={isSubmitting} className="w-full">
              {isSubmitting ? 'Registering...' : 'Create Account & See Results'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SinglePageRegistration;
