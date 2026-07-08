// Image blobs live in Postgres as base64 data URLs, but API responses must
// never carry them inline — a single product list would balloon to many MB
// and mobile devices choke on it. Instead, responses reference
// /api/images/... URLs and image.controller streams the decoded bytes with
// long-lived cache headers.
//
// Two patterns, chosen per model:
//   - Products/banners: the blob column is required (or rows are immutable),
//     so queries `select` everything EXCEPT the blob and the URL is built
//     unconditionally. The blob never leaves Postgres.
//   - Categories: `image` is nullable and the frontend falls back when it is
//     missing, so callers must pass whether an image exists (see
//     category.controller's cheap ids-only existence query).

// ProductImage rows are immutable (only ever created/deleted, never updated),
// so their id alone is a safe forever-cache key.
const productImageSelect = {
  id: true,
  productId: true,
  isPrimary: true,
  color: true,
  order: true,
};

const productImageUrl = (imageId) => `/api/images/product/${imageId}`;

// Banner/Category images are replaced in place, so the URL carries a
// ?v=<updatedAt epoch> that changes on every edit — lets the endpoint serve
// `immutable` cache headers without ever going stale.
const versioned = (base, updatedAt) => {
  const ts = updatedAt ? new Date(updatedAt).getTime() : 0;
  return `${base}?v=${ts}`;
};

const bannerImageUrl = (banner) => versioned(`/api/images/banner/${banner.id}`, banner.updatedAt);
const categoryImageUrl = (category) =>
  versioned(`/api/images/category/${category.id}`, category.updatedAt);
const reviewImageUrl = (review, index) =>
  versioned(`/api/images/review/${review.id}/${index}`, review.updatedAt);

// Replace each ProductImage row's `url` (absent or blob) with its endpoint URL.
function mapProductImages(product) {
  if (!product || !Array.isArray(product.images)) return product;
  return {
    ...product,
    images: product.images.map((img) => ({ ...img, url: productImageUrl(img.id) })),
  };
}

const mapProducts = (products) => products.map(mapProductImages);

// Strips the blob columns if present (create/update return the full row) and
// replaces them with endpoint URLs. `mobileImage` is unused by the app.
function mapBanner(banner) {
  if (!banner) return banner;
  const { image, mobileImage, ...rest } = banner;
  return { ...rest, image: bannerImageUrl(banner), mobileImage: null };
}

const mapBanners = (banners) => banners.map(mapBanner);

// `hasImage` preserves the null semantics the frontend relies on for its
// placeholder fallback.
function mapCategory(category, hasImage) {
  if (!category) return category;
  const { image, ...rest } = category;
  return { ...rest, image: hasImage ? categoryImageUrl(category) : null };
}

// Review.images is a String[] of blobs; emit one indexed URL per entry.
function mapReview(review) {
  if (!review || !Array.isArray(review.images)) return review;
  return {
    ...review,
    images: review.images.map((_, idx) => reviewImageUrl(review, idx)),
  };
}

const mapReviews = (reviews) => reviews.map(mapReview);

module.exports = {
  productImageSelect,
  productImageUrl,
  mapProductImages,
  mapProducts,
  mapBanner,
  mapBanners,
  mapCategory,
  mapReview,
  mapReviews,
};
