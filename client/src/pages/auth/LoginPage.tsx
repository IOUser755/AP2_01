import { Link, useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@hooks/useAuth';
import { LoadingSpinner } from '@components/common/LoadingSpinner';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      const redirectTo = (location.state as { from?: { pathname: string } } | undefined)?.from?.pathname ??
        '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // handled by auth context toast/error state
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-left">
        <h2 className="text-2xl font-semibold text-gray-900">Welcome back</h2>
        <p className="text-sm text-gray-500">Sign in to continue building AI payment workflows.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="form-label" htmlFor="email">
            Email address
          </label>
          <input id="email" type="email" className="form-input" {...register('email')} />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        <div>
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input id="password" type="password" className="form-input" {...register('password')} />
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" /> : 'Sign in'}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <Link className="text-primary-600 hover:text-primary-700" to="/forgot-password">
          Forgot password?
        </Link>
        <span>
          New here?{' '}
          <Link className="text-primary-600 hover:text-primary-700" to="/register">
            Create an account
          </Link>
        </span>
      </div>
    </div>
  );
}

export default LoginPage;
