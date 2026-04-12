import { useState } from 'react';
import { Star, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useListAllReviewsQuery,
  useApproveReviewMutation,
  useDeleteReviewMutation,
} from '../../store/api/adminApi';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';

export default function AdminReviews() {
  const [filter, setFilter] = useState('');
  const { data, isLoading } = useListAllReviewsQuery({ status: filter });
  const [approveReview] = useApproveReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();

  if (isLoading) return <Loader className="py-24" size="lg" />;

  const reviews = data?.reviews || [];

  const handleApprove = async (id) => {
    await approveReview(id);
    toast.success('Approved');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this review?')) return;
    await deleteReview(id);
    toast.success('Deleted');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif">Reviews</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white border rounded-lg p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.user?.name}</span>
                  <span className="text-xs text-brand-muted">· {r.user?.email}</span>
                </div>
                <p className="text-xs text-brand-muted mt-1">
                  on <strong>{r.product?.name}</strong> — {formatDate(r.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i <= r.rating ? 'fill-brand-secondary text-brand-secondary' : 'text-gray-300'}
                  />
                ))}
              </div>
            </div>
            {r.title && <p className="font-medium text-sm">{r.title}</p>}
            <p className="text-sm text-brand-muted mt-1">{r.comment}</p>
            <div className="flex items-center gap-2 mt-4">
              <span className={`badge ${r.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {r.isApproved ? 'Approved' : 'Pending'}
              </span>
              {!r.isApproved && (
                <button
                  onClick={() => handleApprove(r.id)}
                  className="text-xs text-green-600 hover:underline flex items-center gap-1"
                >
                  <Check size={12} /> Approve
                </button>
              )}
              <button
                onClick={() => handleDelete(r.id)}
                className="text-xs text-red-600 hover:underline flex items-center gap-1"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-center text-brand-muted py-12">No reviews.</p>}
      </div>
    </div>
  );
}
