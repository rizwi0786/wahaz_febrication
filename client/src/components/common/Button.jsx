import clsx from 'clsx';

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  ...props
}) {
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  };
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-dark',
    secondary: 'bg-brand-secondary text-white hover:opacity-90',
    outline: 'border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white',
    ghost: 'text-brand-primary hover:bg-brand-primary/5',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
        variants[variant],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
