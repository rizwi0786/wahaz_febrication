import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useForgotPasswordMutation } from '../store/api/authApi';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const schema = z.object({ email: z.string().email('Invalid email') });

export default function ForgotPassword() {
  const [forgot, { isLoading }] = useForgotPasswordMutation();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    try {
      await forgot(values).unwrap();
      toast.success('If the email exists, a reset link has been sent.');
    } catch {
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="section py-16 max-w-md">
      <div className="card p-8">
        <h1 className="text-3xl font-serif mb-2 text-center">Forgot password?</h1>
        <p className="text-sm text-brand-muted text-center mb-6">
          Enter your email and we'll send you a reset link
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Button type="submit" loading={isLoading} className="w-full">
            Send Reset Link
          </Button>
        </form>
        <p className="text-center text-sm text-brand-muted mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-brand-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
