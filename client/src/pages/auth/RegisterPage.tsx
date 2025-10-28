import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { useAuth } from '@hooks/useAuth';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Badge } from '@components/common/Badge';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number and special character'
      ),
    confirmPassword: z.string(),
    tenantName: z.string().min(2, 'Organization name must be at least 2 characters'),
    subscriptionPlan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL']).optional(),
    agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

type PlanId = 'FREE' | 'STARTER' | 'PROFESSIONAL';

const plans: Array<{
  id: PlanId;
  name: string;
  price: string;
  description: string;
  features: string[];
  popular: boolean;
}> = [
  {
    id: 'FREE',
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    features: ['5 Agents', '100 Transactions/month', 'Basic Templates', 'Email Support'],
    popular: false,
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: '$99',
    description: 'For growing businesses',
    features: ['25 Agents', '1,000 Transactions/month', 'Premium Templates', 'Priority Support'],
    popular: true,
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: '$299',
    description: 'For established enterprises',
    features: ['Unlimited Agents', 'Unlimited Transactions', 'Custom Templates', 'Phone Support'],
    popular: false,
  },
];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('STARTER');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      subscriptionPlan: 'STARTER',
      agreeToTerms: false,
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      await registerUser({
        ...data,
        subscriptionPlan: selectedPlan,
      });
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast.error(error?.message ?? 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRequirement = (condition: boolean, label: string) => (
    <div className={`flex items-center ${condition ? 'text-green-600' : 'text-gray-400'}`}>
      <CheckIcon className="h-3 w-3 mr-1" />
      {label}
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-lg">A2</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    {...register('firstName')}
                    label="First Name"
                    placeholder="Enter first name"
                    error={errors.firstName?.message}
                  />
                  <Input
                    {...register('lastName')}
                    label="Last Name"
                    placeholder="Enter last name"
                    error={errors.lastName?.message}
                  />
                </div>
                <Input
                  {...register('email')}
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  error={errors.email?.message}
                  className="mt-4"
                />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Organization</h3>
                <Input
                  {...register('tenantName')}
                  label="Organization Name"
                  placeholder="Enter organization name"
                  error={errors.tenantName?.message}
                />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
                <Input
                  {...register('password')}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  error={errors.password?.message}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="text-gray-400 hover:text-gray-500"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  }
                />

                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-500">Password requirements:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {renderRequirement(password.length >= 8, '8+ characters')}
                      {renderRequirement(/[A-Z]/.test(password), 'Uppercase letter')}
                      {renderRequirement(/[a-z]/.test(password), 'Lowercase letter')}
                      {renderRequirement(/\d/.test(password), 'Number')}
                    </div>
                  </div>
                )}

                <Input
                  {...register('confirmPassword')}
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  error={errors.confirmPassword?.message}
                  className="mt-4"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className="text-gray-400 hover:text-gray-500"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  }
                />
              </div>

              <div className="flex items-start">
                <input
                  {...register('agreeToTerms')}
                  id="agree-terms"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && <p className="text-sm text-error-600">{errors.agreeToTerms.message}</p>}

              <Button type="submit" loading={isLoading} fullWidth className="mt-6">
                Create Account
              </Button>
            </form>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Choose Your Plan</h3>

            <div className="space-y-4">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPlan === plan.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                  role="radio"
                  aria-checked={selectedPlan === plan.id}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selectedPlan === plan.id}
                        onChange={() => setSelectedPlan(plan.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">{plan.name}</span>
                          {plan.popular && (
                            <Badge variant="primary" size="sm" className="ml-2">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{plan.description}</div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {plan.price}
                      <span className="text-sm font-normal">/month</span>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-600">
                    <ul className="grid grid-cols-2 gap-1">
                      {plan.features.map(feature => (
                        <li key={feature} className="flex items-center">
                          <CheckIcon className="h-3 w-3 text-green-500 mr-1" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                🎉 <strong>Special Offer:</strong> Get 14 days free trial on any paid plan!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
