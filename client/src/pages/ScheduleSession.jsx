import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarCheck, Video, ArrowLeft } from 'lucide-react';
import { useCreateConsultationMutation, useMyConsultationsQuery } from '../store/api/consultationApi';
import { selectCurrentUser } from '../store/slices/authSlice';
import Input, { Select } from '../components/common/Input';
import Button from '../components/common/Button';
import { formatDate } from '../utils/format';

const TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30',
];

const DURATIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
];

const STATUS_CLS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
};

export default function ScheduleSession() {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [create, { isLoading }] = useCreateConsultationMutation();
  const { data: myList } = useMyConsultationsQuery(undefined, { skip: !user });

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    preferredDate: '',
    preferredTime: '10:00',
    duration: 30,
    topic: '',
    notes: '',
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.preferredDate || !form.preferredTime) {
      return toast.error('Please fill all required fields');
    }
    try {
      const res = await create(form).unwrap();
      toast.success(`Booked! Reference: ${res.consultation.bookingNumber}`);
      if (user) navigate('/services/schedule');
      setForm({ ...form, preferredDate: '', topic: '', notes: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to book session');
    }
  };

  const myConsultations = myList?.consultations || [];

  return (
    <div className="section py-8 max-w-4xl">
      <Link to="/services" className="inline-flex items-center text-sm text-brand-muted hover:text-brand-primary mb-4">
        <ArrowLeft size={14} className="mr-1" /> Back to services
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-brand-secondary/10 text-brand-secondary flex items-center justify-center">
          <CalendarCheck size={20} />
        </div>
        <h1 className="text-2xl md:text-3xl font-serif">Schedule a Session</h1>
      </div>
      <p className="text-sm text-brand-muted mb-6">
        Book a virtual consultation. We'll confirm with a Google Meet link by email.
      </p>

      <form onSubmit={submit} className="card p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Input label="Your name *" value={form.name} onChange={set('name')} required />
          <Input label="Email *" type="email" value={form.email} onChange={set('email')} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Input label="Phone *" value={form.phone} onChange={set('phone')} required />
          <Input label="Preferred date *" type="date" min={today} value={form.preferredDate} onChange={set('preferredDate')} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Preferred time *</label>
            <select className="input" value={form.preferredTime} onChange={set('preferredTime')}>
              {TIME_SLOTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Duration</label>
            <select className="input" value={form.duration} onChange={set('duration')}>
              {DURATIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
        <Input
          label="Topic / what would you like to discuss?"
          value={form.topic}
          onChange={set('topic')}
          placeholder="e.g. Wedding sherwani consultation"
        />
        <label className="label mt-3">Additional notes</label>
        <textarea className="input min-h-[80px]" value={form.notes} onChange={set('notes')} />

        <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4 flex gap-2 text-xs text-blue-900">
          <Video size={16} className="shrink-0 mt-0.5" />
          <span>Once you book, our team will confirm and send you a Google Meet link via email.</span>
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="submit" loading={isLoading}>Book session</Button>
        </div>
      </form>

      {user && myConsultations.length > 0 && (
        <div>
          <h2 className="font-serif text-xl mb-3">Your sessions</h2>
          <div className="space-y-3">
            {myConsultations.map((c) => (
              <div key={c.id} className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{c.bookingNumber}</p>
                  <p className="text-xs text-brand-muted">
                    {formatDate(c.preferredDate)} at {c.preferredTime} · {c.duration} mins
                  </p>
                  {c.topic && <p className="text-xs text-brand-muted truncate">Topic: {c.topic}</p>}
                  {c.meetLink && (
                    <a
                      href={c.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-secondary underline inline-flex items-center gap-1 mt-1"
                    >
                      <Video size={12} /> Join meeting
                    </a>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium self-start ${STATUS_CLS[c.status] || 'bg-gray-100 text-gray-700'}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
