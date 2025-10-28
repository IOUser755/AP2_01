import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@hooks/useAuth';
import { LoadingSpinner } from '@components/common/LoadingSpinner';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Enter a valid email address'),
    tenantName: z.string().min(2, 'Workspace name is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine(values => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        tenantName: data.tenantName,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-left">
        <h2 className="text-2xl font-semibold text-gray-900">Create your workspace</h2>
        <p className="text-sm text-gray-500">
          Set up your AgentPay Hub account and start deploying production-ready payment agents.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="form-label" htmlFor="firstName">
              First name
            </label>
            <input id="firstName" className="form-input" {...register('firstName')} />
            {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="form-label" htmlFor="lastName">
              Last name
            </label>
            <input id="lastName" className="form-input" {...register('lastName')} />
            {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="form-label" htmlFor="email">
            Work email
          </label>
          <input id="email" type="email" className="form-input" {...register('email')} />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        <div>
          <label className="form-label" htmlFor="tenantName">
            Workspace name
          </label>
          <input id="tenantName" className="form-input" {...register('tenantName')} />
          {errors.tenantName && <p className="form-error">{errors.tenantName.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input id="password" type="password" className="form-input" {...register('password')} />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>
          <div>
            <label className="form-label" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" /> : 'Create workspace'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link className="text-primary-600 hover:text-primary-700" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
