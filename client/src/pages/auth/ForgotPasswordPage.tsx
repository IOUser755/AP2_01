import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    console.warn('Password reset request', data);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-left">
        <h2 className="text-2xl font-semibold text-gray-900">Reset your password</h2>
        <p className="text-sm text-gray-500">
          Enter your email address and we will send you instructions to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="form-label" htmlFor="email">
            Email address
          </label>
          <input id="email" type="email" className="form-input" {...register('email')} />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        {isSubmitSuccessful ? (
          <p className="rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700">
            If an account exists for that email address, you will receive an email shortly.
          </p>
        ) : null}

        <button type="submit" className="btn-primary w-full">
          Send reset link
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Remembered your password?{' '}
        <Link className="text-primary-600 hover:text-primary-700" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default ForgotPasswordPage;
