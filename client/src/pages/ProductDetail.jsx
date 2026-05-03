import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Heart, Share2, Star, Truck, ShieldCheck, RefreshCw, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetProductQuery } from '../store/api/productApi';
import { useAddToCartMutation } from '../store/api/cartApi';
import { useAddToWishlistMutation } from '../store/api/userApi';
import ProductCard from '../components/product/ProductCard';
import SizeChartModal from '../components/product/SizeChartModal';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import { formatCurrency } from '../utils/format';
import { selectIsAuthenticated } from '../store/slices/authSlice';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isAuth = useSelector(selectIsAuthenticated);
  const { data, isLoading } = useGetProductQuery(slug);
  const [addToCart, { isLoading: adding }] = useAddToCartMutation();
  const [addToWishlist] = useAddToWishlistMutation();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  const product = data?.product;
  const related = data?.related || [];

  const colors = useMemo(() => {
    if (!product?.variants) return [];
    const seen = new Set();
    return product.variants.filter((v) => {
      if (seen.has(v.color)) return false;
      seen.add(v.color);
      return true;
    });
  }, [product]);

  const sizesForColor = useMemo(() => {
    if (!product?.variants || !selectedColor) return [];
    return product.variants.filter((v) => v.color === selectedColor);
  }, [product, selectedColor]);

  const isColorOutOfStock = (colorName) => {
    if (!product?.variants) return false;
    const variants = product.variants.filter((v) => v.color === colorName);
    return variants.length > 0 && variants.every((v) => v.stock === 0);
  };

  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null;
    return product?.variants?.find((v) => v.color === selectedColor && v.size === selectedSize);
  }, [product, selectedColor, selectedSize]);

  const allOutOfStock = product?.variants?.length > 0 && product.variants.every((v) => v.stock === 0);

  const galleryImages = useMemo(() => {
    if (!product?.images?.length) return [];
    const noColor = product.images.filter((img) => !img.color);
    if (selectedColor) {
      const byColor = product.images.filter((img) => img.color === selectedColor);
      if (byColor.length > 0 || noColor.length > 0) return [...noColor, ...byColor];
    }
    return noColor.length > 0 ? noColor : product.images;
  }, [product, selectedColor]);

  useEffect(() => {
    setSelectedImage(0);
  }, [galleryImages]);

  if (isLoading) return <Loader className="py-24" size="lg" />;
  if (!product) return <p className="text-center py-24">Product not found</p>;

  const hasDiscount = product.discountPrice && Number(product.discountPrice) < Number(product.price);
  const displayPrice = hasDiscount ? product.discountPrice : product.price;

  const handleAddToCart = async () => {
    if (!isAuth) return navigate('/login');
    if (!selectedVariant) return toast.error('Please select color and size');
    try {
      await addToCart({
        productId: product.id,
        variantId: selectedVariant.id,
        quantity,
      }).unwrap();
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    if (selectedVariant) navigate('/checkout');
  };

  const handleWishlist = async () => {
    if (!isAuth) return navigate('/login');
    try {
      await addToWishlist(product.id).unwrap();
      toast.success('Added to wishlist');
    } catch {
      toast.error('Failed to add to wishlist');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied');
  };

  const ratingBreakdown = [5, 4, 3, 2, 1].map((r) => {
    const count = product.reviews?.filter((rev) => rev.rating === r).length || 0;
    const pct = product.reviews?.length ? (count / product.reviews.length) * 100 : 0;
    return { r, count, pct };
  });

  return (
    <div className="section py-8">
      <nav className="text-xs text-brand-muted mb-6 flex flex-wrap items-center gap-x-1">
        <Link to="/" className="hover:text-brand-primary">Home</Link> /{' '}
        <Link to="/shop" className="hover:text-brand-primary">Shop</Link>
        {product.categories?.map((c) => (
          <span key={c.id} className="flex items-center gap-x-1">
            / <Link to={`/shop?category=${c.slug}`} className="hover:text-brand-primary">{c.name}</Link>
          </span>
        ))}
        <span>/ <span className="text-brand-primary">{product.name}</span></span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6 md:gap-10">
        {/* Gallery */}
        <div>
          <div className="bg-gray-100 rounded-lg overflow-hidden aspect-[4/5] md:aspect-auto md:max-h-[65vh] md:flex md:items-center md:justify-center mb-4">
            <img
              src={galleryImages[selectedImage]?.url}
              alt={product.name}
              className="w-full h-full object-cover md:object-contain"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none">
            {galleryImages.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(i)}
                className={`shrink-0 w-20 h-24 rounded overflow-hidden border-2 transition ${
                  selectedImage === i ? 'border-brand-secondary' : 'border-transparent'
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl md:text-4xl font-serif">{product.name}</h1>
          <div className="flex items-center gap-3 mt-2 mb-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={14}
                  className={
                    i <= Math.round(Number(product.avgRating))
                      ? 'fill-brand-secondary text-brand-secondary'
                      : 'text-gray-300'
                  }
                />
              ))}
            </div>
            <a href="#reviews" className="text-sm text-brand-muted hover:text-brand-primary underline">
              {product.totalReviews} reviews
            </a>
          </div>

          <div className="flex flex-wrap items-baseline gap-2 md:gap-3 mb-6">
            <span className="text-2xl md:text-3xl font-serif">{formatCurrency(displayPrice)}</span>
            {hasDiscount && (
              <>
                <span className="text-base md:text-lg text-brand-muted line-through">{formatCurrency(product.price)}</span>
                <span className="badge bg-brand-secondary text-white">{product.discountPercent}% OFF</span>
              </>
            )}
          </div>

          {/* Out of stock banner */}
          {allOutOfStock && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 font-medium">
              This product is currently out of stock
            </div>
          )}

          {/* Color */}
          {colors.length > 0 && (
            <div className="mb-4">
              <label className="label">
                Color: <span className="font-normal">{selectedColor || 'Select'}</span>
                {selectedColor && isColorOutOfStock(selectedColor) && (
                  <span className="ml-2 text-xs font-medium text-red-600">(Out of stock)</span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {colors.map((v) => {
                  const oos = isColorOutOfStock(v.color);
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedColor(v.color);
                        setSelectedSize('');
                      }}
                      title={oos ? `${v.color} — Out of stock` : v.color}
                      className={`relative w-10 h-10 rounded-full border-2 transition ${
                        selectedColor === v.color ? 'border-brand-secondary scale-110' : 'border-gray-200'
                      } ${oos ? 'opacity-50' : ''}`}
                      style={{ backgroundColor: v.colorHex || '#888' }}
                    >
                      {oos && (
                        <span
                          aria-hidden
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <span className="block w-[140%] h-[2px] bg-red-500 rotate-45" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size */}
          {sizesForColor.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <label className="label">Size</label>
                <button
                  type="button"
                  onClick={() => setSizeChartOpen(true)}
                  className="text-xs text-brand-secondary hover:underline"
                >
                  Size guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizesForColor.map((v) => {
                  const oos = v.stock === 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedSize(v.size)}
                      disabled={oos}
                      title={oos ? 'Out of stock' : ''}
                      className={`relative min-w-[48px] px-4 py-2 text-sm border rounded transition overflow-hidden ${
                        selectedSize === v.size
                          ? 'bg-brand-primary text-white border-brand-primary'
                          : oos
                          ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                          : 'border-gray-300 hover:border-brand-primary'
                      }`}
                    >
                      {v.size}
                      {oos && (
                        <span
                          aria-hidden
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <span className="block w-full h-[1.5px] bg-red-400 rotate-[-20deg]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {sizesForColor.every((v) => v.stock === 0) && (
                <p className="text-xs text-red-600 mt-2 font-medium">All sizes for this color are out of stock</p>
              )}
              {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
                <p className="text-xs text-orange-600 mt-2 font-medium">Only {selectedVariant.stock} left in stock</p>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <label className="label">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 border border-gray-300 rounded hover:border-brand-primary"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 border border-gray-300 rounded hover:border-brand-primary"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Button onClick={handleAddToCart} loading={adding} className="flex-1">
              Add to Cart
            </Button>
            <Button onClick={handleBuyNow} variant="secondary" className="flex-1">
              Buy Now
            </Button>
            <button
              onClick={handleWishlist}
              className="p-3 border border-gray-300 rounded-md hover:border-brand-primary"
              aria-label="Wishlist"
            >
              <Heart size={18} />
            </button>
            <button
              onClick={handleShare}
              className="p-3 border border-gray-300 rounded-md hover:border-brand-primary"
              aria-label="Share"
            >
              <Share2 size={18} />
            </button>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-3 text-sm border-t pt-6">
            {product.fabric?.length > 0 && (
              <div><span className="text-brand-muted">Fabric: </span>{product.fabric.join(', ')}</div>
            )}
            {product.fit?.length > 0 && (
              <div><span className="text-brand-muted">Fit: </span>{product.fit.join(', ')}</div>
            )}
            {product.occasion?.length > 0 && (
              <div><span className="text-brand-muted">Occasion: </span>{product.occasion.join(', ')}</div>
            )}
            {product.careInstructions && (
              <div><span className="text-brand-muted">Care: </span>{product.careInstructions}</div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-6 text-xs">
            <div className="flex items-center gap-2"><Truck size={16} /> Free shipping</div>
            <div className="flex items-center gap-2"><ShieldCheck size={16} /> Secure checkout</div>
            <div className="flex items-center gap-2"><RefreshCw size={16} /> Easy returns</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10 md:mt-16">
        <div className="border-b flex gap-4 sm:gap-8 overflow-x-auto scrollbar-none">
          {['description', 'reviews', 'shipping'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-3 text-sm font-medium capitalize whitespace-nowrap transition ${
                activeTab === t
                  ? 'text-brand-primary border-b-2 border-brand-secondary'
                  : 'text-brand-muted'
              }`}
            >
              {t === 'description' ? 'Description' : t === 'reviews' ? `Reviews (${product.totalReviews})` : 'Shipping & Returns'}
            </button>
          ))}
        </div>
        <div className="py-6">
          {activeTab === 'description' && (
            <p className="text-sm text-brand-muted leading-relaxed max-w-3xl whitespace-pre-wrap">
              {product.description}
            </p>
          )}
          {activeTab === 'reviews' && (
            <div id="reviews">
              <div className="grid md:grid-cols-[200px_1fr] gap-8 mb-8">
                <div className="text-center">
                  <p className="text-5xl font-serif">{Number(product.avgRating).toFixed(1)}</p>
                  <div className="flex items-center justify-center gap-0.5 my-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={16} className="fill-brand-secondary text-brand-secondary" />
                    ))}
                  </div>
                  <p className="text-xs text-brand-muted">{product.totalReviews} reviews</p>
                </div>
                <div className="space-y-2">
                  {ratingBreakdown.map(({ r, count, pct }) => (
                    <div key={r} className="flex items-center gap-3 text-sm">
                      <span className="w-8">{r}★</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                        <div className="h-full bg-brand-secondary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-xs text-brand-muted">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                {product.reviews?.length ? product.reviews.map((r) => (
                  <div key={r.id} className="border-b pb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{r.user?.name}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} size={12} className={i <= r.rating ? 'fill-brand-secondary text-brand-secondary' : 'text-gray-300'} />
                        ))}
                      </div>
                    </div>
                    {r.title && <p className="font-medium text-sm mt-1">{r.title}</p>}
                    <p className="text-sm text-brand-muted mt-1">{r.comment}</p>
                  </div>
                )) : <p className="text-sm text-brand-muted">No reviews yet.</p>}
              </div>
            </div>
          )}
          {activeTab === 'shipping' && (
            <div className="text-sm text-brand-muted leading-relaxed max-w-2xl space-y-3">
              <p>• Free standard shipping on orders above Rs 999</p>
              <p>• Standard delivery: 3-7 business days</p>
              <p>• Express delivery available at checkout</p>
              <p>• Easy 7-day returns on unworn items with tags</p>
              <p>• Refunds processed within 5-7 business days</p>
            </div>
          )}
        </div>
      </div>

      <SizeChartModal
        open={sizeChartOpen}
        onClose={() => setSizeChartOpen(false)}
        productFits={product.fit || []}
      />

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12 md:mt-16">
          <h2 className="text-xl md:text-2xl font-serif mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
