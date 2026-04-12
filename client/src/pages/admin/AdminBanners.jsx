import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useListAllBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} from '../../store/api/adminApi';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';

const EMPTY = { title: '', subtitle: '', link: '', position: 0, isActive: true };

export default function AdminBanners() {
  const { data, isLoading } = useListAllBannersQuery();
  const [createBanner] = useCreateBannerMutation();
  const [updateBanner] = useUpdateBannerMutation();
  const [deleteBanner] = useDeleteBannerMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);

  if (isLoading) return <Loader className="py-24" size="lg" />;

  const banners = data?.banners || [];

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setImage(null);
    setModalOpen(true);
  };
  const openEdit = (b) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      link: b.link || '',
      position: b.position,
      isActive: b.isActive,
    });
    setImage(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) return toast.error('Title is required');
    if (!editing && !image) return toast.error('Image is required');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);

      if (editing) {
        await updateBanner({ id: editing.id, formData: fd }).unwrap();
        toast.success('Banner updated');
      } else {
        await createBanner(fd).unwrap();
        toast.success('Banner created');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this banner?')) return;
    await deleteBanner(id);
    toast.success('Deleted');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif">Banners</h1>
        <Button onClick={openNew}><Plus size={14} /> Add Banner</Button>
      </div>

      <div className="space-y-3">
        {banners.map((b) => (
          <div key={b.id} className="bg-white border rounded-lg overflow-hidden flex">
            <img src={b.image} alt={b.title} className="w-60 h-32 object-cover shrink-0" />
            <div className="p-4 flex-1 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg">{b.title}</h3>
                  <span className={`badge ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {b.subtitle && <p className="text-sm text-brand-muted">{b.subtitle}</p>}
                <p className="text-xs text-brand-muted mt-1">Position: {b.position} · Link: {b.link || '—'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(b)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(b.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit banner' : 'New banner'} size="lg">
        <div className="space-y-3">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <Input label="Link" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/shop?category=..." />
          <Input label="Position" type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />
          <div>
            <label className="label">Image</label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0])} className="text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
