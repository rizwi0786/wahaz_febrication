import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import {
  useAdminGetCustomOrderQuery,
  useAdminQuotePriceMutation,
  useAdminRespondCounterMutation,
  useAdminRejectCustomOrderMutation,
} from '../../store/api/customOrderApi';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { formatCurrency, formatDate } from '../../utils/format';

export default function AdminCustomOrderDetail() {
  const { id } = useParams();
  const { data, isLoading, refetch } = useAdminGetCustomOrderQuery(id);
  const [quotePrice, { isLoading: quoting }] = useAdminQuotePriceMutation();
  const [respondCounter, { isLoading: responding }] = useAdminRespondCounterMutation();
  const [reject, { isLoading: rejecting }] = useAdminRejectCustomOrderMutation();

  const [quotedPrice, setQuotedPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  if (isLoading) return <Loader className="py-24" size="lg" />;
  const co = data?.customOrder;
  if (!co) return <div>Not found</div>;

  const onQuote = async () => {
    if (!quotedPrice || Number(quotedPrice) <= 0) return toast.error('Enter a valid price');
    try {
      await quotePrice({ id: co.id, quotedPrice: Number(quotedPrice), adminNotes }).unwrap();
      toast.success('Quote sent to customer');
      setQuotedPrice(''); setAdminNotes('');
      refetch();
    } catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  const onAcceptCounter = async () => {
    try {
      await respondCounter({
        id: co.id,
        decision: 'ACCEPT',
        finalPrice: finalPrice ? Number(finalPrice) : Number(co.userCounterPrice),
        adminNotes,
      }).unwrap();
      toast.success('Counter accepted — customer can now place the order');
      refetch();
    } catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  const onRejectCounter = async () => {
    try {
      await respondCounter({
        id: co.id, decision: 'REJECT', rejectReason, adminNotes,
      }).unwrap();
      toast.success('Counter rejected');
      refetch();
    } catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  const onReject = async () => {
    if (!confirm('Reject this custom design request?')) return;
    try {
      await reject({ id: co.id, rejectReason }).unwrap();
      toast.success('Rejected');
      refetch();
    } catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <Link to="/admin/custom-orders" className="inline-flex items-center text-sm text-brand-muted hover:text-brand-primary mb-4">
        <ArrowLeft size={14} className="mr-1" /> All custom orders
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif">{co.requestNumber}</h1>
          <p className="text-sm text-brand-muted">
            {co.user?.name} · {co.user?.email}{co.user?.phone ? ` · ${co.user.phone}` : ''} · Submitted {formatDate(co.createdAt)}
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-gray-100 self-start">{co.status}</span>
      </div>

      {/* Action panel based on status */}
      {co.status === 'PENDING_REVIEW' && (
        <div className="bg-white rounded-lg shadow p-5 mb-5">
          <h2 className="font-serif text-lg mb-3">Send price quote</h2>
          <div className="space-y-3">
            <Input
              label="Unit price (Rs.)"
              type="number"
              value={quotedPrice}
              onChange={(e) => setQuotedPrice(e.target.value)}
            />
            <div>
              <label className="label">Notes for customer (optional)</label>
              <textarea className="input min-h-[70px]" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={onQuote} loading={quoting}>Send quote</Button>
              <Button variant="ghost" onClick={onReject} loading={rejecting}>Reject request</Button>
            </div>
            <Input
              label="Reject reason (if rejecting)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </div>
      )}

      {co.status === 'PRICE_QUOTED' && (
        <div className="bg-white rounded-lg shadow p-5 mb-5">
          <p className="text-sm">
            Quote of <strong>{formatCurrency(co.adminQuotedPrice)}</strong> sent. Awaiting customer response.
          </p>
          <p className="text-xs text-brand-muted mt-1">Customer can accept or send a one-time counter offer.</p>
          <div className="mt-3">
            <Input
              label="Revise quote (Rs.)"
              type="number"
              value={quotedPrice}
              onChange={(e) => setQuotedPrice(e.target.value)}
            />
            <div className="flex gap-2 mt-3">
              <Button onClick={onQuote} loading={quoting} variant="outline">Update quote</Button>
            </div>
          </div>
        </div>
      )}

      {co.status === 'COUNTER_OFFERED' && (
        <div className="bg-white rounded-lg shadow p-5 mb-5 border-2 border-purple-200">
          <h2 className="font-serif text-lg mb-2">Customer counter offer</h2>
          <p className="text-sm mb-1">Original quote: <strong>{formatCurrency(co.adminQuotedPrice)}</strong></p>
          <p className="text-sm mb-3">Customer counter: <strong className="text-purple-700">{formatCurrency(co.userCounterPrice)}</strong></p>
          {co.userNotes && <p className="text-sm bg-gray-50 p-2 rounded mb-3">"{co.userNotes}"</p>}
          <div className="space-y-3">
            <Input
              label="Final price (defaults to counter)"
              type="number"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              placeholder={String(co.userCounterPrice)}
            />
            <div>
              <label className="label">Admin notes (optional)</label>
              <textarea className="input min-h-[60px]" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onAcceptCounter} loading={responding}>Accept & approve</Button>
              <Button variant="outline" onClick={onRejectCounter} loading={responding}>Reject counter</Button>
            </div>
            <Input
              label="Rejection reason (if rejecting)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </div>
      )}

      {co.status === 'APPROVED' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5">
          <p className="text-sm">Approved at <strong>{formatCurrency(co.finalPrice)}</strong> per unit. Awaiting customer to place the order.</p>
        </div>
      )}

      {co.status === 'PAID' && co.orderId && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-5">
          <p className="text-sm">Order placed. <Link to={`/admin/orders/${co.orderId}`} className="underline">View order →</Link></p>
        </div>
      )}

      {/* Detail */}
      <div className="bg-white rounded-lg shadow p-5 mb-5">
        <h2 className="font-serif text-lg mb-3">Design images</h2>
        <div className="flex flex-wrap gap-3 mb-5">
          {co.designImages.map((src, i) => (
            <a key={i} href={src} target="_blank" rel="noreferrer">
              <img src={src} alt="" className="w-32 h-32 object-cover rounded border" />
            </a>
          ))}
        </div>
        {co.clothPhotos?.length > 0 && (
          <>
            <h3 className="font-serif text-lg mb-3">Fabric photos</h3>
            <div className="flex flex-wrap gap-3 mb-5">
              {co.clothPhotos.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer">
                  <img src={src} alt="" className="w-32 h-32 object-cover rounded border" />
                </a>
              ))}
            </div>
          </>
        )}
        <h3 className="font-serif text-lg mb-3">Measurements</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
          {Object.entries(co.sizeDetails || {}).filter(([, v]) => String(v || '').trim() !== '').map(([k, v]) => (
            <div key={k} className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-brand-muted capitalize">
                {k.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p className="font-medium">{v}</p>
            </div>
          ))}
        </div>
        {co.description && (
          <>
            <h3 className="font-serif text-lg mb-2 mt-3">Description</h3>
            <p className="text-sm whitespace-pre-wrap">{co.description}</p>
          </>
        )}
        {co.userNotes && (
          <>
            <h3 className="font-serif text-lg mb-2 mt-3">Customer notes</h3>
            <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">{co.userNotes}</p>
          </>
        )}
        <p className="text-xs text-brand-muted mt-4">Quantity: {co.quantity}</p>
      </div>
    </div>
  );
}
