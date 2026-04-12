import clsx from 'clsx';
import { statusColor } from '../../utils/format';

export default function Badge({ children, variant, className }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-brand-primary text-white',
    secondary: 'bg-brand-secondary text-white',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded',
        variants[variant] || 'bg-gray-100 text-gray-700',
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded',
        statusColor(status)
      )}
    >
      {String(status).replace(/_/g, ' ')}
    </span>
  );
}
