import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRegisterMutation } from '../store/api/authApi';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const schema = z
  .object({
    name: z.string().min(2, 'Enter your name'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(7, 'Enter a valid phone'),
    password: z.string().min(8, 'Min 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function Register() {
  const navigate = useNavigate();
  const [signUp, { isLoading }] = useRegisterMutation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ confirmPassword, ...values }) => {
    try {
      await signUp(values).unwrap();
      toast.success('Account created. Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="section py-16 max-w-md">
      <div className="card p-8">
        <h1 className="text-3xl font-serif mb-2 text-center">Create account</h1>
        <p className="text-sm text-brand-muted text-center mb-6">Join Bellissimo Couture</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full name" {...register('name')} error={errors.name?.message} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
          <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
          <Input
            label="Confirm password"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" loading={isLoading} className="w-full">
            Create Account
          </Button>
        </form>
        <p className="text-center text-sm text-brand-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
