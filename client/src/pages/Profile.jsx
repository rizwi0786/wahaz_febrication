import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Plus, Check } from 'lucide-react';
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} from '../store/api/userApi';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

const EMPTY_ADDRESS = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  isDefault: false,
};

export default function Profile() {
  const { data, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: savingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPw }] = useChangePasswordMutation();
  const [addAddress] = useAddAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();

  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [addrModal, setAddrModal] = useState(null); // null | 'new' | id

  const user = data?.user;
  const addresses = user?.addresses || [];

  // Hydrate form once user data arrives
  useEffect(() => {
    if (user) setProfile({ name: user.name, phone: user.phone || '' });
  }, [user]);

  if (isLoading) return <Loader className="py-24" size="lg" />;

  const handleSaveProfile = async () => {
    try {
      const fd = new FormData();
      fd.append('name', profile.name);
      fd.append('phone', profile.phone);
      await updateProfile(fd).unwrap();
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }).unwrap();
      toast.success('Password changed. Please log in again.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  return (
    <div className="section py-8 max-w-5xl">
      <h1 className="text-2xl md:text-3xl font-serif mb-6">My Account</h1>

      <div className="grid md:grid-cols-[200px_1fr] gap-4 md:gap-6">
        {/* Horizontal pills on mobile, vertical list on desktop */}
        <aside className="card p-3 md:p-4 h-fit flex md:block overflow-x-auto scrollbar-none gap-2 md:gap-0">
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'addresses', label: 'Addresses' },
            { key: 'password', label: 'Password' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 md:w-full text-left px-3 py-2 rounded text-sm transition whitespace-nowrap ${
                tab === t.key ? 'bg-brand-primary text-white' : 'hover:bg-brand-light'
              }`}
            >
              {t.label}
            </button>
          ))}
        </aside>

        <div className="card p-4 sm:p-6">
          {tab === 'profile' && (
            <div className="space-y-4 max-w-md">
              <h2 className="text-xl font-serif mb-2">Profile Information</h2>
              <Input
                label="Full name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
              <Input label="Email" value={user?.email} disabled />
              <Input
                label="Phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
              <Button onClick={handleSaveProfile} loading={savingProfile}>Save Changes</Button>
            </div>
          )}

          {tab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif">Saved Addresses</h2>
                <Button onClick={() => setAddrModal('new')} size="sm">
                  <Plus size={14} /> Add new
                </Button>
              </div>
              {addresses.length === 0 ? (
                <p className="text-sm text-brand-muted">No addresses saved.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((a) => (
                    <div key={a.id} className="border rounded-md p-4 relative">
                      {a.isDefault && (
                        <span className="absolute top-2 right-2 badge bg-brand-secondary text-white">
                          Default
                        </span>
                      )}
                      <p className="font-medium">{a.fullName}</p>
                      <p className="text-sm text-brand-muted mt-1">
                        {a.addressLine1}, {a.city}, {a.state} {a.pincode}
                      </p>
                      <p className="text-sm text-brand-muted">{a.phone}</p>
                      <div className="flex gap-2 mt-3 text-xs">
                        <button
                          onClick={() => setAddrModal(a.id)}
                          className="text-brand-secondary hover:underline flex items-center gap-1"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => deleteAddress(a.id)}
                          className="text-red-600 hover:underline flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'password' && (
            <div className="space-y-4 max-w-md">
              <h2 className="text-xl font-serif mb-2">Change Password</h2>
              <Input
                label="Current password"
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              />
              <Input
                label="New password"
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              />
              <Input
                label="Confirm password"
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              />
              <Button onClick={handleChangePassword} loading={changingPw}>
                Update Password
              </Button>
            </div>
          )}
        </div>
      </div>

      <AddressModal
        open={!!addrModal}
        onClose={() => setAddrModal(null)}
        address={
          addrModal === 'new'
            ? EMPTY_ADDRESS
            : addresses.find((a) => a.id === addrModal) || EMPTY_ADDRESS
        }
        isNew={addrModal === 'new'}
        onSave={async (data) => {
          try {
            if (addrModal === 'new') {
              await addAddress(data).unwrap();
              toast.success('Address added');
            } else {
              await updateAddress({ id: addrModal, ...data }).unwrap();
              toast.success('Address updated');
            }
            setAddrModal(null);
          } catch {
            toast.error('Save failed');
          }
        }}
      />
    </div>
  );
}

function AddressModal({ open, onClose, address, isNew, onSave }) {
  const [form, setForm] = useState(address);

  // Reset the form whenever the modal opens with a (possibly new) address
  useEffect(() => {
    if (open) setForm(address);
  }, [address, open]);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Add address' : 'Edit address'} size="lg">
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Full name" value={form.fullName} onChange={update('fullName')} />
          <Input label="Phone" value={form.phone} onChange={update('phone')} />
        </div>
        <Input label="Address line 1" value={form.addressLine1} onChange={update('addressLine1')} />
        <Input label="Address line 2" value={form.addressLine2 || ''} onChange={update('addressLine2')} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Input label="City" value={form.city} onChange={update('city')} />
          <Input label="State" value={form.state} onChange={update('state')} />
          <Input label="Pincode" value={form.pincode} onChange={update('pincode')} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          />
          Set as default address
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}>
            <Check size={14} /> Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
