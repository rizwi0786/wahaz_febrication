import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Truck, Shield, RefreshCw, Award, ChevronRight, MessageSquare, Ruler, Layers, Scissors } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import {
  useListBannersQuery,
  useFeaturedProductsQuery,
  useNewArrivalsQuery,
  useListCategoriesQuery,
} from '../store/api/productApi';
import { useSubscribeNewsletterMutation } from '../store/api/newsletterApi';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/common/Loader';

// Tile images live in client/public/occasions/<key>.jpg — drop your own photos
// there using the filename in `key`. `fallback` is shown only until you do.
const OCCASIONS = [
  { label: 'Formal', key: 'formal', query: 'occasion=Formal', img: '/occasions/formal.jpg', fallback: 'https://picsum.photos/seed/formal/600/800' },
  { label: 'Casual', key: 'casual', query: 'occasion=Casual', img: '/occasions/casual.jpg', fallback: 'https://picsum.photos/seed/casual/600/800' },
  { label: 'Wedding', key: 'wedding', query: 'occasion=Wedding', img: '/occasions/wedding.jpg', fallback: 'https://picsum.photos/seed/wedding/600/800' },
  { label: 'Party', key: 'party', query: 'occasion=Party', img: '/occasions/party.jpg', fallback: 'https://picsum.photos/seed/party/600/800' },
  { label: 'Business', key: 'business', query: 'occasion=Business', img: '/occasions/business.jpg', fallback: 'https://picsum.photos/seed/business/600/800' },
  { label: 'Festive', key: 'festive', query: 'occasion=Festive', img: '/occasions/festive.jpg', fallback: 'https://picsum.photos/seed/festive/600/800' },
  { label: 'Cocktail', key: 'cocktail', query: 'occasion=Cocktail', img: '/occasions/cocktail.jpg', fallback: 'https://picsum.photos/seed/cocktail/600/800' },
  { label: 'Traditional', key: 'traditional', query: 'occasion=Traditional', img: '/occasions/traditional.jpg', fallback: 'https://picsum.photos/seed/traditional/600/800' },
];

// "The Bellissimo Process" — bespoke journey shown on the home page.
const PROCESS = [
  { Icon: MessageSquare, title: 'Consultation', desc: 'We understand your style, occasion, and vision.' },
  { Icon: Ruler, title: 'Measurement', desc: 'Precise measurements taken by our expert tailors.' },
  { Icon: Layers, title: 'Fabric Selection', desc: 'Choose from our curated library of premium fabrics.' },
  { Icon: Scissors, title: 'Crafting', desc: 'Hand-finished by master tailors over several weeks.' },
  { Icon: Truck, title: 'Delivery', desc: 'Your bespoke garment arrives, perfectly finished.' },
];

const USPS = [
  { Icon: Truck, title: 'Free Shipping', desc: 'On orders above Rs 999' },
  { Icon: Award, title: 'Premium Quality', desc: 'Crafted with finest fabrics' },
  { Icon: RefreshCw, title: 'Easy Returns', desc: '7-day return policy' },
  { Icon: Shield, title: 'Secure Payment', desc: '100% protected checkout' },
];

export default function Home() {
  const { data: bannerData } = useListBannersQuery();
  const { data: featuredData, isLoading: loadingFeatured } = useFeaturedProductsQuery();
  const { data: newData, isLoading: loadingNew } = useNewArrivalsQuery();
  const { data: catData } = useListCategoriesQuery();

  const [email, setEmail] = useState('');
  const [subscribe, { isLoading: subscribing }] = useSubscribeNewsletterMutation();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return toast.error('Please enter your email');
    try {
      const res = await subscribe({ email: value, source: 'home-footer' }).unwrap();
      toast.success(res?.message || 'Thank you for subscribing!');
      setEmail('');
    } catch (err) {
      toast.error(err?.data?.message || 'Could not subscribe. Please try again.');
    }
  };

  // Backend already filters to only active banners (`where: { isActive: true }`)
  // sorted by position, so we can render them all directly.
  const banners = bannerData?.banners || [];
  const featured = featuredData?.products || [];
  const newArrivals = newData?.products || [];
  const categories = catData?.categories || [];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-brand-primary text-white overflow-hidden">
        {banners.length > 0 ? (
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            loop={banners.length > 1}
            autoplay={
              banners.length > 1
                ? { delay: 5000, disableOnInteraction: false }
                : false
            }
            pagination={{ clickable: true }}
            navigation={banners.length > 1}
            className="hero-swiper"
          >
            {banners.map((banner) => (
              <SwiperSlide key={banner.id}>
                <div className="relative h-[55vh] sm:h-[60vh] md:h-[75vh]">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                  <div className="relative section h-full flex items-center">
                    <div className="max-w-xl">
                      {banner.subtitle && (
                        <p className="text-brand-secondary font-medium mb-3 tracking-widest uppercase text-xs sm:text-sm">
                          {banner.subtitle}
                        </p>
                      )}
                      <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif mb-4 md:mb-6 leading-tight">
                        {banner.title}
                      </h1>
                      <Link
                        to={banner.link || '/shop'}
                        className="btn-secondary inline-flex text-sm md:text-base"
                      >
                        Shop Now <ChevronRight size={18} />
                      </Link>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="section py-16 md:py-24 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif mb-4">
              Designer Attire. Timeless Impression.
            </h1>
            <p className="text-white/70 mb-6">Tradition meets contemporary elegance. Crafted for excellence.</p>
            <Link to="/shop" className="btn-secondary inline-flex">
              Shop the Collection
            </Link>
          </div>
        )}
      </section>

      {/* USPs */}
      <section className="section py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
        {USPS.map(({ Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="p-3 bg-brand-primary/5 rounded-full">
              <Icon size={20} className="text-brand-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{title}</h4>
              <p className="text-xs text-brand-muted">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories — carousel, backend already returns only active ones */}
      <section className="section py-10 md:py-12">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-4xl font-serif mb-2">Shop by Category</h2>
          <p className="text-brand-muted text-sm md:text-base">
            Curated collections for every occasion
          </p>
        </div>
        {categories.length > 0 && (
          <Swiper
            modules={[Autoplay, Navigation]}
            spaceBetween={16}
            slidesPerView={2}
            navigation={categories.length > 2}
            loop={categories.length > 6}
            autoplay={
              categories.length > 6
                ? { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }
                : false
            }
            breakpoints={{
              640: { slidesPerView: 3, spaceBetween: 16 },
              768: { slidesPerView: 4, spaceBetween: 16 },
              1024: { slidesPerView: 6, spaceBetween: 16 },
            }}
            className="category-swiper"
          >
            {categories.map((cat) => (
              <SwiperSlide key={cat.id}>
                <Link
                  to={`/shop?category=${cat.slug}`}
                  className="group relative aspect-square overflow-hidden rounded-lg block"
                >
                  <img
                    src={cat.image || `https://picsum.photos/seed/${cat.slug}/400/400`}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition" />
                  <h3 className="absolute inset-0 flex items-center justify-center text-white font-serif text-base md:text-xl text-center px-2">
                    {cat.name}
                  </h3>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </section>

      {/* New arrivals */}
      <section className="section py-10 md:py-12">
        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif">New Arrivals</h2>
            <p className="text-brand-muted text-xs md:text-sm">Fresh picks for the season</p>
          </div>
          <Link to="/shop?newArrivals=true" className="text-sm text-brand-secondary hover:underline hidden md:block">
            View all →
          </Link>
        </div>
        {loadingNew ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Featured */}
      <section className="section py-10 md:py-12 bg-white/50 rounded-3xl my-6">
        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif">Featured Collection</h2>
            <p className="text-brand-muted text-xs md:text-sm">Our most loved pieces</p>
          </div>
          <Link to="/shop?featured=true" className="text-sm text-brand-secondary hover:underline hidden md:block">
            View all →
          </Link>
        </div>
        {loadingFeatured ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featured.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Shop by occasion */}
      <section className="section py-10 md:py-12">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-4xl font-serif mb-2">Shop by Occasion</h2>
          <p className="text-brand-muted text-sm md:text-base">Dressed for the moment</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {OCCASIONS.map((o) => (
            <Link
              key={o.label}
              to={`/shop?${o.query}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-lg"
            >
              <img
                src={o.img}
                alt={o.label}
                onError={(e) => {
                  if (e.currentTarget.src !== o.fallback) e.currentTarget.src = o.fallback;
                }}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                <h3 className="text-white font-serif text-lg sm:text-2xl">{o.label}</h3>
                <p className="text-white/70 text-xs mt-1">Shop now →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Our process */}
      <section className="section pt-10 md:pt-14 pb-6 md:pb-8">
        <div className="text-center mb-10 md:mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-secondary mb-2">How it works</p>
          <h2 className="text-2xl md:text-4xl font-serif mb-2">The Bellissimo Process</h2>
          <p className="text-brand-muted text-sm md:text-base">
            From first conversation to final fitting — every step designed around you.
          </p>
        </div>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-y-8 gap-x-3 max-w-5xl mx-auto">
          {PROCESS.map((step, i) => (
            <li
              key={step.title}
              className="relative flex items-start gap-4 lg:flex-col lg:items-center lg:text-center lg:gap-4"
            >
              {/* Connector line between steps on the desktop row */}
              {i < PROCESS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden lg:block absolute top-8 left-1/2 w-full h-px bg-brand-secondary/30"
                />
              )}
              <div className="relative z-10 shrink-0 w-16 h-16 rounded-full bg-white border border-brand-secondary/40 text-brand-secondary flex items-center justify-center shadow-sm">
                <step.Icon size={24} />
              </div>
              <div className="lg:px-1">
                <div className="flex items-center gap-2 lg:justify-center">
                  <span className="text-xs font-semibold text-brand-secondary tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-serif text-lg text-brand-primary">{step.title}</h3>
                </div>
                <p className="text-xs md:text-sm text-brand-muted mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
          <Link to="/services/schedule" className="btn-primary">Book a consultation</Link>
          <Link to="/services" className="btn-outline">Explore our services</Link>
        </div>
      </section>

      {/* Newsletter — contained card. Negative bottom margin pulls the
          shared footer (mt-20) up so the card sits close to it on the home
          page only, without touching the global footer spacing. */}
      <section className="section pb-4 md:pb-6 -mb-16 md:-mb-20">
        <div className="bg-brand-primary text-white rounded-3xl px-6 py-12 md:py-14 text-center">
          <h2 className="text-2xl md:text-4xl font-serif mb-3">Stay in style</h2>
          <p className="text-white/70 mb-6 text-sm md:text-base">Join our newsletter for exclusive offers and new arrivals</p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-white/10 border border-white/20 rounded px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-brand-secondary"
            />
            <button type="submit" className="btn-secondary" disabled={subscribing}>
              {subscribing ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
