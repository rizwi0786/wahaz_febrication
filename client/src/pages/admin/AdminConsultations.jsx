import { useState } from 'react';
import toast from 'react-hot-toast';
import { Video, Check, X, CheckCheck } from 'lucide-react';
import {
  useAdminListConsultationsQuery,
  useAdminConfirmConsultationMutation,
  useAdminCancelConsultationMutation,
  useAdminCompleteConsultationMutation,
} from '../../store/api/consultationApi';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/format';

const STATUS_CLS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
};

export default function AdminConsultations() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAdminListConsultationsQuery({ status, search });
  const [confirmBooking, { isLoading: confirming }] = useAdminConfirmConsultationMutation();
  const [cancel] = useAdminCancelConsultationMutation();
  const [complete] = useAdminCompleteConsultationMutation();

  const [selected, setSelected] = useState(null);
  const [meetLink, setMeetLink] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  if (isLoading) return <Loader className="py-24" size="lg" />;
  const list = data?.consultations || [];

  const openConfirm = (c) => {
    setSelected(c);
    setMeetLink(c.meetLink || '');
    setAdminNotes(c.adminNotes || '');
  };

  const submitConfirm = async () => {
    if (!meetLink.trim()) return toast.error('Paste a Google Meet link');
    try {
      await confirmBooking({ id: selected.id, meetLink: meetLink.trim(), adminNotes }).unwrap();
      toast.success('Confirmed — customer notified');
      setSelected(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  const onCancel = async (c) => {
    const reason = prompt('Reason for cancelling? (optional)') || '';
    try {
      await cancel({ id: c.id, reason }).unwrap();
      toast.success('Cancelled');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  const onComplete = async (c) => {
    if (!confirm('Mark this session as completed?')) return;
    try {
      await complete(c.id).unwrap();
      toast.success('Marked complete');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-serif mb-5">Consultations</h1>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Search by booking#, name, email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Booking</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">When</th>
              <th className="text-left px-4 py-3">Topic</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Meet link</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-brand-muted">No consultations yet.</td></tr>
            )}
            {list.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.bookingNumber}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-brand-muted">{c.email}</p>
                  <p className="text-xs text-brand-muted">{c.phone}</p>
                </td>
                <td className="px-4 py-3 text-xs">
                  {formatDate(c.preferredDate)}<br />
                  {c.preferredTime} · {c.duration}m
                </td>
                <td className="px-4 py-3 text-xs">{c.topic || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_CLS[c.status]}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {c.meetLink ? (
                    <a href={c.meetLink} target="_blank" rel="noreferrer" className="text-brand-secondary underline inline-flex items-center gap-1">
                      <Video size={12} /> Open
                    </a>
                  ) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {c.status === 'PENDING' && (
                      <>
                        <button onClick={() => openConfirm(c)} className="text-xs text-green-700 hover:underline inline-flex items-center gap-1">
                          <Check size={12} /> Confirm
                        </button>
                        <button onClick={() => onCancel(c)} className="text-xs text-red-600 hover:underline inline-flex items-center gap-1">
                          <X size={12} /> Cancel
                        </button>
                      </>
                    )}
                    {c.status === 'CONFIRMED' && (
                      <>
                        <button onClick={() => openConfirm(c)} className="text-xs text-blue-700 hover:underline">
                          Update link
                        </button>
                        <button onClick={() => onComplete(c)} className="text-xs text-emerald-700 hover:underline inline-flex items-center gap-1">
                          <CheckCheck size={12} /> Complete
                        </button>
                        <button onClick={() => onCancel(c)} className="text-xs text-red-600 hover:underline">
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Confirm session">
        {selected && (
          <div className="space-y-3">
            <div className="text-sm bg-gray-50 p-3 rounded">
              <p className="font-medium">{selected.name}</p>
              <p className="text-xs text-brand-muted">{selected.email} · {selected.phone}</p>
              <p className="text-xs text-brand-muted">
                {formatDate(selected.preferredDate)} at {selected.preferredTime} · {selected.duration}m
              </p>
            </div>
            <Input
              label="Google Meet link *"
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
            />
            <p className="text-xs text-brand-muted -mt-2">
              Tip: open Google Calendar, create an event with "Add Google Meet video conferencing", copy the join link, and paste here.
            </p>
            <div>
              <label className="label">Notes for customer (optional)</label>
              <textarea
                className="input min-h-[70px]"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
              <Button onClick={submitConfirm} loading={confirming}>Confirm & email customer</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
