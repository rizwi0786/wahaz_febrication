import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import {
  useAdminGetProductQuery,
  useAdminListProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUploadProductImagesMutation,
  useDeleteProductImageMutation,
} from '../../store/api/adminApi';
import { useListCategoriesQuery } from '../../store/api/productApi';
import Button from '../../components/common/Button';
import Input, { Textarea } from '../../components/common/Input';

// Multi-word -> initials of each word (e.g. "Stone Gray" -> "SG").
// Single word -> first 3 chars (e.g. "Red" -> "RED").
function skuPart(s) {
  const words = (s || '').split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (words.length === 0) return 'XXX';
  if (words.length >= 2) {
    return words.map((w) => w[0]).join('').toUpperCase().slice(0, 4);
  }
  return words[0].slice(0, 3).toUpperCase();
}

function generateSku({ categoryName, color, size, sequence }) {
  if (!size || !color || !categoryName) return '';
  const cat = skuPart(categoryName);
  const col = skuPart(color);
  const sz = (size || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'X';
  const seq = String(sequence || 0).padStart(4, '0');
  return `${cat}-${col}-${sz}-${seq}`;
}

function calcDiscountPrice(price, percent) {
  const p = Number(price);
  const pct = Number(percent);
  if (!p || !pct || pct <= 0 || pct >= 100) return '';
  return Math.round(p - (p * pct) / 100);
}

const OCCASION_OPTIONS = ['Formal', 'Casual', 'Wedding', 'Party', 'Business', 'Festive', 'Seasonal', 'High-End', 'Traditional', 'Cocktail'];
const FABRIC_OPTIONS = ['Cotton', 'Wool', 'Silk', 'Linen', 'Polyester', 'Velvet', 'Tweed', 'Cashmere', 'Satin', 'Brocade', 'Denim'];
const FIT_OPTIONS = ['Slim Fit', 'Regular Fit', 'Tailored Fit', 'Relaxed Fit', 'Classic Fit', 'Oversized'];

const EMPTY_VARIANT = { size: '', color: '', colorHex: '#000000', stock: 0, sku: '' };

const EMPTY = {
  name: '',
  description: '',
  price: '',
  discountPrice: '',
  discountPercent: '',
  categoryIds: [],
  tags: '',
  fabric: [],
  fit: [],
  occasion: [],
  careInstructions: '',
  isFeatured: false,
  isNewArrival: false,
  isActive: true,
  stock: 0,
};

function ChipMultiSelect({ options, selected, onChange, allowCustom = false }) {
  const [draft, setDraft] = useState('');
  const toggle = (val) => {
    onChange(selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val]);
  };
  const addCustom = () => {
    const v = draft.trim();
    if (!v) return;
    if (!selected.includes(v)) onChange([...selected, v]);
    setDraft('');
  };
  const merged = Array.from(new Set([...options, ...selected]));
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {merged.map((opt) => (
          <button
            type="button"
            key={opt}
            onClick={() => toggle(opt)}
            className={`px-3 py-1 text-xs rounded-full border transition ${
              selected.includes(opt)
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-white text-brand-primary border-gray-300 hover:border-brand-primary'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {allowCustom && (
        <div className="flex gap-2 mt-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Add custom value"
            className="input py-1 text-xs flex-1"
          />
          <button
            type="button"
            onClick={addCustom}
            className="text-xs px-3 py-1 border rounded hover:bg-gray-50"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

function ImageGroup({ label, existingImages, files, onFilesChange, onDeleteExisting }) {
  return (
    <div className="border rounded p-4">
      <h4 className="font-medium text-sm mb-3">{label}</h4>
      {existingImages?.length > 0 && (
        <div className="grid grid-cols-5 gap-3 mb-3">
          {existingImages.map((img) => (
            <div key={img.id} className="relative group">
              <img src={img.url} alt="" className="w-full aspect-square object-cover rounded" />
              <button
                type="button"
                onClick={() => onDeleteExisting(img.id)}
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
        onChange={(e) => onFilesChange(Array.from(e.target.files || []))}
        className="text-sm"
      />
      {files?.length > 0 && (
        <p className="text-xs text-brand-muted mt-2">{files.length} new file(s) ready to upload</p>
      )}
    </div>
  );
}

export default function AdminProductForm({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: catData } = useListCategoriesQuery();
  const { data: productData } = useAdminGetProductQuery(id, { skip: mode === 'create' });
  // Use the admin listing so we count active + inactive products. With
  // soft-delete, this total only ever grows, which keeps SKU sequences
  // unique even after a product is deactivated.
  const { data: productListData } = useAdminListProductsQuery({ limit: 1, page: 1 });
  const productCount = productListData?.total || 0;

  // One sequence number per product. In edit mode, parse it from any
  // existing variant SKU so we don't change SKUs when re-saving.
  const productSequence = useMemo(() => {
    if (mode === 'edit' && productData?.product?.variants?.length) {
      for (const v of productData.product.variants) {
        const m = (v.sku || '').match(/-(\d{4,})$/);
        if (m) return Number(m[1]);
      }
    }
    return (productCount || 0) + 1;
  }, [mode, productData, productCount]);

  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [uploadImages, { isLoading: uploading }] = useUploadProductImagesMutation();
  const [deleteImage] = useDeleteProductImageMutation();

  const [form, setForm] = useState(EMPTY);
  const [variants, setVariants] = useState([EMPTY_VARIANT]);
  const [pendingUploads, setPendingUploads] = useState({ default: [] });

  useEffect(() => {
    if (mode === 'edit' && productData?.product) {
      const p = productData.product;
      let percent = p.discountPercent || '';
      if (!percent && p.discountPrice && p.price) {
        const inferred = Math.round(
          ((Number(p.price) - Number(p.discountPrice)) / Number(p.price)) * 100
        );
        if (inferred > 0 && inferred < 100) percent = inferred;
      }
      const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
      setForm({
        name: p.name,
        description: p.description,
        price: p.price,
        discountPercent: percent,
        discountPrice: calcDiscountPrice(p.price, percent),
        categoryIds: (p.categories || []).map((c) => c.id),
        tags: p.tags?.join(', ') || '',
        fabric: asArray(p.fabric),
        fit: asArray(p.fit),
        occasion: asArray(p.occasion),
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

  const distinctColors = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const v of variants) {
      const c = (v.color || '').trim();
      if (c && !seen.has(c)) {
        seen.add(c);
        out.push(c);
      }
    }
    return out;
  }, [variants]);

  const firstCategoryName = useMemo(() => {
    if (!form.categoryIds.length) return '';
    const c = categories.find((x) => x.id === form.categoryIds[0]);
    return c?.name || '';
  }, [form.categoryIds, categories]);

  const addVariant = () => setVariants([...variants, { ...EMPTY_VARIANT }]);
  const updateVariant = (i, field, val) => {
    const next = [...variants];
    next[i] = { ...next[i], [field]: val };
    // Only auto-fill SKU for NEW variants (no DB id). Existing variants
    // keep whatever SKU they were saved with so we don't disturb history.
    if ((field === 'size' || field === 'color') && !next[i].id) {
      const v = next[i];
      const auto = generateSku({
        categoryName: firstCategoryName,
        color: v.color,
        size: v.size,
        sequence: productSequence,
      });
      if (auto) next[i].sku = auto;
    }
    setVariants(next);
  };
  const removeVariant = (i) => setVariants(variants.filter((_, j) => j !== i));

  // Re-generate SKUs only for NEW variants when category/sequence settles.
  useEffect(() => {
    if (!firstCategoryName) return;
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id) return v;                    // existing variant, never touch
        if (!v.size || !v.color) return v;
        const auto = generateSku({
          categoryName: firstCategoryName,
          color: v.color,
          size: v.size,
          sequence: productSequence,
        });
        return auto ? { ...v, sku: auto } : v;
      })
    );
  }, [firstCategoryName, productSequence]);

  const toggleCategory = (cid) => {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(cid)
        ? f.categoryIds.filter((x) => x !== cid)
        : [...f.categoryIds, cid],
    }));
  };

  const setFilesForKey = (key, files) =>
    setPendingUploads((prev) => ({ ...prev, [key]: files }));

  const existingByGroup = useMemo(() => {
    const groups = { default: [] };
    for (const c of distinctColors) groups[c] = [];
    for (const img of existingImages) {
      if (img.color && groups[img.color]) groups[img.color].push(img);
      else groups.default.push(img);
    }
    return groups;
  }, [existingImages, distinctColors]);

  const handleSubmit = async () => {
    if (!form.name || !form.description || !form.price || form.categoryIds.length === 0) {
      return toast.error('Name, description, price, and at least one category are required');
    }
    try {
      const payload = {
        ...form,
        variants: variants.filter((v) => v.size && v.color),
      };
      let productId = id;
      if (mode === 'create') {
        const res = await createProduct(payload).unwrap();
        productId = res.product.id;
        toast.success('Product created');
      } else {
        await updateProduct({ id, ...payload }).unwrap();
        toast.success('Product updated');
      }

      const batches = Object.entries(pendingUploads).filter(([, files]) => files?.length);
      for (const [key, files] of batches) {
        const fd = new FormData();
        files.forEach((f) => {
          fd.append('images', f);
          fd.append('color', key === 'default' ? '' : key);
        });
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
                    placeholder="SKU (auto)"
                    className="input py-2 text-xs bg-gray-50 cursor-not-allowed"
                    value={v.sku}
                    readOnly
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

          <div className="bg-white rounded-lg p-6 border space-y-4">
            <h3 className="font-serif text-lg">Images</h3>
            <ImageGroup
              label="Default gallery"
              existingImages={existingByGroup.default}
              files={pendingUploads.default}
              onFilesChange={(files) => setFilesForKey('default', files)}
              onDeleteExisting={(imageId) => deleteImage({ id, imageId })}
            />
            {distinctColors.map((color) => (
              <ImageGroup
                key={color}
                label={`Photos for color: ${color}`}
                existingImages={existingByGroup[color] || []}
                files={pendingUploads[color]}
                onFilesChange={(files) => setFilesForKey(color, files)}
                onDeleteExisting={(imageId) => deleteImage({ id, imageId })}
              />
            ))}
          </div>

          <div className="bg-white rounded-lg p-6 border space-y-4">
            <h3 className="font-serif text-lg mb-2">Product Details</h3>
            <div>
              <label className="label">Fabric</label>
              <ChipMultiSelect
                options={FABRIC_OPTIONS}
                selected={form.fabric}
                onChange={(v) => setForm({ ...form, fabric: v })}
                allowCustom
              />
            </div>
            <div>
              <label className="label">Fit</label>
              <ChipMultiSelect
                options={FIT_OPTIONS}
                selected={form.fit}
                onChange={(v) => setForm({ ...form, fit: v })}
                allowCustom
              />
            </div>
            <div>
              <label className="label">Occasion</label>
              <ChipMultiSelect
                options={OCCASION_OPTIONS}
                selected={form.occasion}
                onChange={(v) => setForm({ ...form, occasion: v })}
                allowCustom
              />
            </div>
            <Input
              label="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
            <Textarea
              label="Care instructions"
              value={form.careInstructions}
              onChange={(e) => setForm({ ...form, careInstructions: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 border">
            <h3 className="font-serif text-lg mb-4">Categories</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.categoryIds.includes(c.id)}
                    onChange={() => toggleCategory(c.id)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
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
