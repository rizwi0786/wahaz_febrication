import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useResetPasswordMutation } from '../store/api/authApi';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const schema = z
  .object({
    password: z.string().min(8, 'Min 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [resetPw, { isLoading }] = useResetPasswordMutation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ password }) => {
    try {
      await resetPw({ token, password }).unwrap();
      toast.success('Password reset. Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="section py-16 max-w-md">
      <div className="card p-8">
        <h1 className="text-3xl font-serif mb-2 text-center">Reset password</h1>
        <p className="text-sm text-brand-muted text-center mb-6">Enter your new password</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="New password"
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />
          <Input
            label="Confirm password"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" loading={isLoading} className="w-full">
            Reset Password
          </Button>
        </form>
        <p className="text-center text-sm text-brand-muted mt-6">
          <Link to="/login" className="text-brand-primary font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
