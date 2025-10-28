import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/api.ts';

const schema = z.object({
  email: z.string().email(),
});

type ForgotPasswordForm = z.infer<typeof schema>;

function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ForgotPasswordForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ForgotPasswordForm) => {
    await apiClient.post('/auth/forgot-password', data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-white">Reset your password</h1>
          <p className="text-sm text-slate-400">Enter your email to receive reset instructions.</p>
        </div>

        {isSubmitSuccessful ? (
          <div className="rounded border border-green-500 bg-green-500/10 p-4 text-sm text-green-300">
            If an account exists for that email we have sent reset instructions.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              disabled={isSubmitting}
            >
              Send reset link
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-400">
          Remember your password?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
