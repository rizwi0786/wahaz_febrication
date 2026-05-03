import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAdminListProductsQuery,
  useDeleteProductMutation,
  useUpdateProductMutation,
} from '../../store/api/adminApi';
import Loader from '../../components/common/Loader';
import { formatCurrency } from '../../utils/format';

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAdminListProductsQuery({ search, limit: 50 });
  const [deleteProduct] = useDeleteProductMutation();
  const [updateProduct] = useUpdateProductMutation();

  if (isLoading) return <Loader className="py-24" size="lg" />;

  const products = data?.products || [];

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product? It will be hidden from customers but kept on file. You can re-activate it later.')) return;
    try {
      await deleteProduct(id).unwrap();
      toast.success('Product deactivated');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  const handleReactivate = async (p) => {
    try {
      await updateProduct({
        id: p.id,
        isActive: true,
        categoryIds: (p.categories || []).map((c) => c.id),
      }).unwrap();
      toast.success('Product re-activated');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif">Products</h1>
          <p className="text-sm text-brand-muted">{data?.total || 0} total</p>
        </div>
        <Link to="/admin/products/add" className="btn-primary">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-brand-muted">
              <tr>
                <th className="text-left px-4 py-3">Image</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <img
                      src={p.images?.[0]?.url}
                      alt=""
                      className="w-12 h-14 object-cover rounded"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-xs">
                    {p.categories?.map((c) => c.name).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(p.discountPrice || p.price)}
                  </td>
                  <td className="px-4 py-3 text-right">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Link to={`/admin/products/edit/${p.id}`} className="p-1.5 hover:bg-blue-50 rounded text-blue-600">
                        <Pencil size={14} />
                      </Link>
                      {p.isActive ? (
                        <button
                          onClick={() => handleDelete(p.id)}
                          title="Deactivate"
                          className="p-1.5 hover:bg-red-50 rounded text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(p)}
                          title="Re-activate"
                          className="p-1.5 hover:bg-green-50 rounded text-green-600"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-brand-muted">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
