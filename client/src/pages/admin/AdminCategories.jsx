import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useListCategoriesQuery } from '../../store/api/productApi';
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../store/api/adminApi';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Input, { Textarea } from '../../components/common/Input';
import Modal from '../../components/common/Modal';

export default function AdminCategories() {
  const { data, isLoading } = useListCategoriesQuery();
  const [createCat] = useCreateCategoryMutation();
  const [updateCat] = useUpdateCategoryMutation();
  const [deleteCat] = useDeleteCategoryMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [image, setImage] = useState(null);

  if (isLoading) return <Loader className="py-24" size="lg" />;

  const categories = data?.categories || [];

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setImage(null);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || '' });
    setImage(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      if (image) fd.append('image', image);

      if (editing) {
        await updateCat({ id: editing.id, formData: fd }).unwrap();
        toast.success('Category updated');
      } else {
        await createCat(fd).unwrap();
        toast.success('Category created');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await deleteCat(id).unwrap();
      toast.success('Deleted');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif">Categories</h1>
        <Button onClick={openNew}><Plus size={14} /> Add Category</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="bg-white border rounded-lg overflow-hidden">
            {c.image && <img src={c.image} alt={c.name} className="w-full h-32 object-cover" />}
            <div className="p-4">
              <h3 className="font-medium">{c.name}</h3>
              <p className="text-xs text-brand-muted">{c._count?.products || 0} products</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(c)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => handleDelete(c.id)} className="text-xs text-red-600 hover:underline flex items-center gap-1">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit category' : 'New category'}>
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          <div>
            <label className="label">Image</label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0])} className="text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
