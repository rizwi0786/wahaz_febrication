import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Shield } from 'lucide-react';
import {
  useListUsersQuery,
  useToggleBlockUserMutation,
  useCreateUserMutation,
} from '../../store/api/adminApi';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input, { Select } from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/format';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'CUSTOMER',
  secretCode: '',
};

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useListUsersQuery({ search });
  const [toggleBlock] = useToggleBlockUserMutation();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  if (isLoading) return <Loader className="py-24" size="lg" />;

  const users = data?.users || [];

  const handleBlock = async (id, isBlocked) => {
    try {
      await toggleBlock(id).unwrap();
      toast.success(isBlocked ? 'User unblocked' : 'User blocked');
    } catch {
      toast.error('Failed');
    }
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setAddOpen(true);
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      return toast.error('Name, email and password are required');
    }
    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    if (form.role === 'ADMIN' && !form.secretCode) {
      return toast.error('Secret code is required to create an admin');
    }
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        role: form.role,
      };
      if (form.role === 'ADMIN') payload.secretCode = form.secretCode;
      await createUser(payload).unwrap();
      toast.success(
        form.role === 'ADMIN' ? 'Admin user created' : 'Customer created'
      );
      setAddOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create user');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif">Users</h1>
          <p className="text-sm text-brand-muted">{data?.total || 0} total</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={14} /> Add user
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full max-w-md px-3 py-2 border rounded-md text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-brand-muted">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-right px-4 py-3">Orders</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-xs">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {u.role === 'ADMIN' ? (
                      <Badge variant="secondary">
                        <Shield size={10} className="inline mr-1" /> Admin
                      </Badge>
                    ) : (
                      <Badge>Customer</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">{u._count?.orders || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleBlock(u.id, u.isBlocked)}
                        className={`text-xs font-medium hover:underline ${
                          u.isBlocked ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add user" size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Password (min 8 chars)"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
            />
          </div>
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value, secretCode: '' })}
          >
            <option value="CUSTOMER">Customer</option>
            <option value="ADMIN">Admin</option>
          </Select>

          {form.role === 'ADMIN' && (
            <div className="border-l-4 border-brand-secondary bg-brand-secondary/5 p-3 rounded-r">
              <div className="flex items-start gap-2 mb-2">
                <Shield size={16} className="text-brand-secondary mt-0.5 shrink-0" />
                <p className="text-xs text-brand-muted">
                  Creating an admin requires the server&apos;s admin creation secret.
                  Ask the owner for the code configured in the server environment.
                </p>
              </div>
              <Input
                label="Admin creation secret"
                type="password"
                value={form.secretCode}
                onChange={(e) => setForm({ ...form, secretCode: e.target.value })}
                autoComplete="off"
                placeholder="Enter secret"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>
              Create {form.role === 'ADMIN' ? 'admin' : 'customer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
