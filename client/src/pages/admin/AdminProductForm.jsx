import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import {
  useAdminGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUploadProductImagesMutation,
  useDeleteProductImageMutation,
} from '../../store/api/adminApi';
import { useListCategoriesQuery } from '../../store/api/productApi';
import Button from '../../components/common/Button';
import Input, { Textarea, Select } from '../../components/common/Input';

// Derived discounted price from price + percent. Returns '' for any
// non-positive / invalid input so the form field stays empty instead
// of showing NaN or a stale number.
function calcDiscountPrice(price, percent) {
  const p = Number(price);
  const pct = Number(percent);
  if (!p || !pct || pct <= 0 || pct >= 100) return '';
  return Math.round(p - (p * pct) / 100);
}

const EMPTY_VARIANT = { size: '', color: '', colorHex: '#000000', stock: 0, sku: '' };

const EMPTY = {
  name: '',
  description: '',
  price: '',
  discountPrice: '',
  discountPercent: '',
  categoryId: '',
  tags: '',
  fabric: '',
  fit: '',
  occasion: '',
  careInstructions: '',
  isFeatured: false,
  isNewArrival: false,
  isActive: true,
  stock: 0,
};

export default function AdminProductForm({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: catData } = useListCategoriesQuery();
  const { data: productData } = useAdminGetProductQuery(id, { skip: mode === 'create' });

  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [uploadImages, { isLoading: uploading }] = useUploadProductImagesMutation();
  const [deleteImage] = useDeleteProductImageMutation();

  const [form, setForm] = useState(EMPTY);
  const [variants, setVariants] = useState([EMPTY_VARIANT]);
  const [imageFiles, setImageFiles] = useState([]);

  useEffect(() => {
    if (mode === 'edit' && productData?.product) {
      const p = productData.product;
      // Older rows may only have discountPrice saved with no percent.
      // Infer the percent from the two prices so the form stays in sync.
      let percent = p.discountPercent || '';
      if (!percent && p.discountPrice && p.price) {
        const inferred = Math.round(
          ((Number(p.price) - Number(p.discountPrice)) / Number(p.price)) * 100
        );
        if (inferred > 0 && inferred < 100) percent = inferred;
      }
      setForm({
        name: p.name,
        description: p.description,
        price: p.price,
        discountPercent: percent,
        discountPrice: calcDiscountPrice(p.price, percent),
        categoryId: p.categoryId,
        tags: p.tags?.join(', ') || '',
        fabric: p.fabric || '',
        fit: p.fit || '',
        occasion: p.occasion || '',
        careInstructions: p.careInstructions || '',
        isFeatured: p.isFeatured,
        isNewArrival: p.isNewArrival,
        isActive: p.isActive,
        stock: p.stock,
      });
      setVariants(p.variants?.length ? p.variants : [EMPTY_VARIANT]);
    }
  }, [productData, mode]);

  const categories = catData?.categories || [];
  const existingImages = productData?.product?.images || [];

  const addVariant = () => setVariants([...variants, { ...EMPTY_VARIANT }]);
  const updateVariant = (i, field, val) => {
    const next = [...variants];
    next[i] = { ...next[i], [field]: val };
    setVariants(next);
  };
  const removeVariant = (i) => setVariants(variants.filter((_, j) => j !== i));

  const handleSubmit = async () => {
    if (!form.name || !form.description || !form.price || !form.categoryId) {
      return toast.error('Name, description, price, and category are required');
    }
    try {
      const payload = { ...form, variants: variants.filter((v) => v.size && v.color) };
      let productId = id;
      if (mode === 'create') {
        const res = await createProduct(payload).unwrap();
        productId = res.product.id;
        toast.success('Product created');
      } else {
        await updateProduct({ id, ...payload }).unwrap();
        toast.success('Product updated');
      }

      // Upload new images
      if (imageFiles.length > 0 && productId) {
        const fd = new FormData();
        imageFiles.forEach((f) => fd.append('images', f));
        await uploadImages({ id: productId, formData: fd }).unwrap();
      }

      navigate('/admin/products');
    } catch (err) {
      toast.error(err?.data?.message || 'Save failed');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-serif mb-6">
        {mode === 'create' ? 'Add Product' : 'Edit Product'}
      </h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg p-6 border">
            <h3 className="font-serif text-lg mb-4">Basic Info</h3>
            <div className="space-y-4">
              <Input
                label="Product name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Textarea
                label="Description"
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => {
                    const price = e.target.value;
                    setForm({
                      ...form,
                      price,
                      discountPrice: calcDiscountPrice(price, form.discountPercent),
                    });
                  }}
                />
                <Input
                  label="Discount %"
                  type="number"
                  min="0"
                  max="100"
                  value={form.discountPercent}
                  onChange={(e) => {
                    const pct = e.target.value;
                    setForm({
                      ...form,
                      discountPercent: pct,
                      discountPrice: calcDiscountPrice(form.price, pct),
                    });
                  }}
                />
                <Input
                  label="Discount price"
                  type="number"
                  value={form.discountPrice}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
              {form.discountPrice && (
                <p className="text-xs text-brand-muted mt-2">
                  Customers will see{' '}
                  <span className="font-medium text-brand-primary">
                    ₹{form.discountPrice}
                  </span>{' '}
                  instead of{' '}
                  <span className="line-through">₹{form.price}</span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg">Variants</h3>
              <Button size="sm" variant="outline" onClick={addVariant}>
                <Plus size={14} /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_80px_80px_1fr_auto] gap-2 items-center">
                  <input
                    placeholder="Size"
                    className="input py-2 text-xs"
                    value={v.size}
                    onChange={(e) => updateVariant(i, 'size', e.target.value)}
                  />
                  <input
                    placeholder="Color"
                    className="input py-2 text-xs"
                    value={v.color}
                    onChange={(e) => updateVariant(i, 'color', e.target.value)}
                  />
                  <input
                    type="color"
                    className="h-10 w-full rounded border"
                    value={v.colorHex || '#000000'}
                    onChange={(e) => updateVariant(i, 'colorHex', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    className="input py-2 text-xs"
                    value={v.stock}
                    onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                  />
                  <input
                    placeholder="SKU"
                    className="input py-2 text-xs"
                    value={v.sku}
                    onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                  />
                  <button
                    onClick={() => removeVariant(i)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border">
            <h3 className="font-serif text-lg mb-4">Images</h3>
            {existingImages.length > 0 && (
              <div className="grid grid-cols-5 gap-3 mb-4">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img src={img.url} alt="" className="w-full aspect-square object-cover rounded" />
                    <button
                      onClick={() => deleteImage({ id, imageId: img.id })}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
              className="text-sm"
            />
            {imageFiles.length > 0 && (
              <p className="text-xs text-brand-muted mt-2">{imageFiles.length} new file(s) ready to upload</p>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 border">
            <h3 className="font-serif text-lg mb-4">Product Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Fabric" value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} />
              <Input label="Fit" value={form.fit} onChange={(e) => setForm({ ...form, fit: e.target.value })} />
              <Input label="Occasion" value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} />
              <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
            <Textarea
              label="Care instructions"
              value={form.careInstructions}
              onChange={(e) => setForm({ ...form, careInstructions: e.target.value })}
              className="mt-3"
              rows={2}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 border">
            <h3 className="font-serif text-lg mb-4">Organization</h3>
            <Select
              label="Category"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Input
              label="Stock"
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="mt-3"
            />
          </div>

          <div className="bg-white rounded-lg p-6 border space-y-3">
            <h3 className="font-serif text-lg mb-2">Visibility</h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isNewArrival}
                onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
              />
              New arrival
            </label>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/admin/products')} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={creating || updating || uploading} className="flex-1">
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
