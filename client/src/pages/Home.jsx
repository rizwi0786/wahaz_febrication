import { Link } from 'react-router-dom';
import { Truck, Shield, RefreshCw, Award, ChevronRight } from 'lucide-react';
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
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/common/Loader';

const OCCASIONS = [
  { label: 'Formal', query: 'occasion=Formal', img: 'https://picsum.photos/seed/formal/600/800' },
  { label: 'Casual', query: 'occasion=Casual', img: 'https://picsum.photos/seed/casual/600/800' },
  { label: 'Wedding', query: 'occasion=Wedding', img: 'https://picsum.photos/seed/wedding/600/800' },
  { label: 'Party', query: 'occasion=Party', img: 'https://picsum.photos/seed/party/600/800' },
  { label: 'Business', query: 'occasion=Business', img: 'https://picsum.photos/seed/business/600/800' },
  { label: 'Festive', query: 'occasion=Festive', img: 'https://picsum.photos/seed/festive/600/800' },
  { label: 'Cocktail', query: 'occasion=Cocktail', img: 'https://picsum.photos/seed/cocktail/600/800' },
  { label: 'Traditional', query: 'occasion=Traditional', img: 'https://picsum.photos/seed/traditional/600/800' },
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
              <img src={o.img} alt={o.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                <h3 className="text-white font-serif text-lg sm:text-2xl">{o.label}</h3>
                <p className="text-white/70 text-xs mt-1">Shop now →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-primary text-white py-14 md:py-20 mt-10">
        <div className="section text-center">
          <h2 className="text-2xl md:text-4xl font-serif mb-3">Stay in style</h2>
          <p className="text-white/70 mb-6 text-sm md:text-base">Join our newsletter for exclusive offers and new arrivals</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 bg-white/10 border border-white/20 rounded px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-brand-secondary"
            />
            <button type="submit" className="btn-secondary">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  );
}
