import { useState, useEffect, useMemo } from 'react';
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
import Input, { Textarea } from '../../components/common/Input';

// Catalog-wide option lists. These mirror the customer-facing filter so that
// admin selections always match the values customers can filter against.
const FABRIC_OPTIONS = ['Cotton', 'Wool', 'Silk', 'Linen', 'Polyester', 'Velvet', 'Denim'];
const FIT_OPTIONS = ['Slim Fit', 'Regular Fit', 'Tailored Fit', 'Relaxed Fit', 'Oversized'];
const OCCASION_OPTIONS = ['Formal', 'Casual', 'Wedding', 'Party', 'Festive', 'Office'];

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

// Small pill-style multi-select. Clicking a chip toggles its inclusion.
function ChipMultiSelect({ options, selected, onChange, allowCustom = false }) {
  const [draft, setDraft] = useState('');
  const toggle = (val) => {
    const next = selected.includes(val)
      ? selected.filter((s) => s !== val)
      : [...selected, val];
    onChange(next);
  };
  const addCustom = () => {
    const v = draft.trim();
    if (!v) return;
    if (!selected.includes(v)) onChange([...selected, v]);
    setDraft('');
  };
  const customSelected = selected.filter((s) => !options.includes(s));
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 text-xs border rounded-full transition ${
              selected.includes(opt)
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'border-gray-300 hover:border-brand-primary'
            }`}
          >
            {opt}
          </button>
        ))}
        {customSelected.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className="px-3 py-1.5 text-xs border rounded-full bg-brand-primary text-white border-brand-primary"
          >
            {opt} ×
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
            className="input py-1.5 text-xs flex-1"
          />
          <button
            type="button"
            onClick={addCustom}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:border-brand-primary"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

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
  // Pending image uploads — { color: string|null, files: File[] }
  // `null` color = the default product gallery (used when no color is selected)
  const [pendingUploads, setPendingUploads] = useState({ default: [] });

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
      // Multi-attribute fields may arrive as arrays (new schema) or as a
      // single string (rows seeded before the migration).
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

  const addVariant = () => setVariants([...variants, { ...EMPTY_VARIANT }]);
  const updateVariant = (i, field, val) => {
    const next = [...variants];
    next[i] = { ...next[i], [field]: val };
    setVariants(next);
  };
  const removeVariant = (i) => setVariants(variants.filter((_, j) => j !== i));

  const toggleCategory = (cid) => {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(cid)
        ? f.categoryIds.filter((x) => x !== cid)
        : [...f.categoryIds, cid],
    }));
  };

  // Distinct color names declared on the variants list. Per-color image
  // sections appear once per color so admins can attach a tailored gallery.
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

  const setUploadFiles = (key, files) => {
    setPendingUploads((u) => ({ ...u, [key]: Array.from(files || []) }));
  };

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

      // Upload any pending image batches. Each batch is tagged with its
      // colour (or null for the shared default gallery) so the server can
      // store it on the right slot.
      if (productId) {
        const batches = Object.entries(pendingUploads).filter(
          ([, files]) => files && files.length > 0
        );
        for (const [key, files] of batches) {
          const fd = new FormData();
          files.forEach((f) => {
            fd.append('images', f);
            fd.append('color', key === 'default' ? '' : key);
          });
          await uploadImages({ id: productId, formData: fd }).unwrap();
        }
      }

      navigate('/admin/products');
    } catch (err) {
      toast.error(err?.data?.message || 'Save failed');
    }
  };

  // Group existing images by color (null → 'default') so they can be shown
  // alongside the matching upload box.
  const imagesByColor = useMemo(() => {
    const groups = { default: [] };
    for (const img of existingImages) {
      const k = img.color || 'default';
      if (!groups[k]) groups[k] = [];
      groups[k].push(img);
    }
    return groups;
  }, [existingImages]);

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
            <h3 className="font-serif text-lg mb-1">Images</h3>
            <p className="text-xs text-brand-muted mb-4">
              The default gallery shows when no color is selected. Add a color in
              Variants to upload color-specific photos.
            </p>

            {/* Default (no-color) gallery */}
            <ImageGroup
              label="Default gallery"
              hint="Shown on the product card and as the fallback gallery."
              existing={imagesByColor.default || []}
              files={pendingUploads.default || []}
              onPick={(files) => setUploadFiles('default', files)}
              onDelete={(imageId) => deleteImage({ id, imageId })}
            />

            {/* Per-color galleries — one block per distinct variant color */}
            {distinctColors.map((color) => (
              <div key={color} className="mt-6 pt-6 border-t">
                <ImageGroup
                  label={`Photos for color: ${color}`}
                  hint={`Shown when a customer picks "${color}" on the product page.`}
                  existing={imagesByColor[color] || []}
                  files={pendingUploads[color] || []}
                  onPick={(files) => setUploadFiles(color, files)}
                  onDelete={(imageId) => deleteImage({ id, imageId })}
                />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg p-6 border">
            <h3 className="font-serif text-lg mb-4">Product Details</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Fabric</label>
                <ChipMultiSelect
                  options={FABRIC_OPTIONS}
                  selected={form.fabric}
                  onChange={(next) => setForm({ ...form, fabric: next })}
                  allowCustom
                />
              </div>
              <div>
                <label className="label">Fit</label>
                <ChipMultiSelect
                  options={FIT_OPTIONS}
                  selected={form.fit}
                  onChange={(next) => setForm({ ...form, fit: next })}
                  allowCustom
                />
              </div>
              <div>
                <label className="label">Occasion</label>
                <ChipMultiSelect
                  options={OCCASION_OPTIONS}
                  selected={form.occasion}
                  onChange={(next) => setForm({ ...form, occasion: next })}
                  allowCustom
                />
              </div>
              <Input
                label="Tags (comma separated)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
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
            <h3 className="font-serif text-lg mb-2">Categories</h3>
            <p className="text-xs text-brand-muted mb-3">
              Pick one or more — products can live in multiple categories.
            </p>
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
              {categories.length === 0 && (
                <p className="text-xs text-brand-muted">No categories yet.</p>
              )}
            </div>
            <Input
              label="Stock"
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="mt-4"
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

function ImageGroup({ label, hint, existing, files, onPick, onDelete }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="text-sm font-medium">{label}</h4>
        <span className="text-xs text-brand-muted">{existing.length} saved</span>
      </div>
      {hint && <p className="text-xs text-brand-muted mb-3">{hint}</p>}
      {existing.length > 0 && (
        <div className="grid grid-cols-5 gap-3 mb-3">
          {existing.map((img) => (
            <div key={img.id} className="relative group">
              <img src={img.url} alt="" className="w-full aspect-square object-cover rounded" />
              {img.isPrimary && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-brand-primary text-white px-1.5 py-0.5 rounded">
                  Primary
                </span>
              )}
              <button
                type="button"
                onClick={() => onDelete(img.id)}
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
        onChange={(e) => onPick(e.target.files)}
        className="text-sm"
      />
      {files.length > 0 && (
        <p className="text-xs text-brand-muted mt-2">{files.length} new file(s) ready to upload</p>
      )}
    </div>
  );
}
