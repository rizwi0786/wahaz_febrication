import { useListCategoriesQuery } from '../../store/api/productApi';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44'];
const COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'Navy', hex: '#0A1F44' },
  { name: 'Charcoal', hex: '#36454F' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Maroon', hex: '#800000' },
];
const OCCASIONS = ['Formal', 'Casual', 'Wedding', 'Party', 'Festive'];
const FABRICS = ['Cotton', 'Wool', 'Silk', 'Linen', 'Polyester'];

export default function ProductFilter({ filters, setFilters }) {
  const { data: catData } = useListCategoriesQuery();
  const categories = catData?.categories || [];

  const toggleArray = (key, value) => {
    const arr = filters[key] ? filters[key].split(',') : [];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    setFilters({ ...filters, [key]: next.join(',') });
  };
  const isChecked = (key, value) => (filters[key] || '').split(',').includes(value);

  const setSingle = (key, value) => setFilters({ ...filters, [key]: value });

  return (
    <aside className="space-y-6 text-sm">
      <div>
        <h4 className="font-semibold mb-3">Category</h4>
        <div className="space-y-2">
          <button
            onClick={() => setSingle('category', '')}
            className={`block text-left w-full ${!filters.category ? 'text-brand-secondary font-medium' : 'text-brand-muted hover:text-brand-primary'}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSingle('category', c.slug)}
              className={`block text-left w-full ${filters.category === c.slug ? 'text-brand-secondary font-medium' : 'text-brand-muted hover:text-brand-primary'}`}
            >
              {c.name} <span className="text-xs">({c._count?.products || 0})</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Price Range</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => setSingle('minPrice', e.target.value)}
            className="input py-2 text-xs"
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => setSingle('maxPrice', e.target.value)}
            className="input py-2 text-xs"
          />
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Size</h4>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggleArray('size', s)}
              className={`px-3 py-1.5 text-xs border rounded ${
                isChecked('size', s) ? 'bg-brand-primary text-white border-brand-primary' : 'border-gray-300 hover:border-brand-primary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Color</h4>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => toggleArray('color', c.name)}
              title={c.name}
              className={`w-8 h-8 rounded-full border-2 transition ${
                isChecked('color', c.name) ? 'border-brand-secondary scale-110' : 'border-gray-200'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Occasion</h4>
        <div className="space-y-2">
          {OCCASIONS.map((o) => (
            <label key={o} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isChecked('occasion', o)}
                onChange={() => toggleArray('occasion', o)}
              />
              <span>{o}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Fabric</h4>
        <div className="space-y-2">
          {FABRICS.map((f) => (
            <label key={f} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isChecked('fabric', f)}
                onChange={() => toggleArray('fabric', f)}
              />
              <span>{f}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={() => setFilters({})}
        className="w-full text-center text-xs text-brand-muted hover:text-brand-primary underline"
      >
        Clear all filters
      </button>
    </aside>
  );
}
