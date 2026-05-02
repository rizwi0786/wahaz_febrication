/**
 * Builds Prisma `where`, `orderBy`, `skip`, and `take` from query params
 * for product listing endpoints.
 *
 * Supported params:
 *   category, minPrice, maxPrice, size, color, occasion, fabric,
 *   rating, sort, page, limit, search, tags, featured, newArrivals
 */
function buildProductQuery(query) {
  const {
    category,
    minPrice,
    maxPrice,
    size,
    color,
    occasion,
    fabric,
    rating,
    sort,
    page = 1,
    limit = 12,
    search,
    tags,
    featured,
    newArrivals,
  } = query;

  const where = { isActive: true };
  const andFilters = [];

  if (category) {
    const slugs = Array.isArray(category) ? category : category.split(',');
    where.categories = { some: { slug: { in: slugs } } };
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  // occasion / fabric are now String[] columns — `hasSome` matches any row
  // whose array overlaps the requested filter list.
  if (occasion) {
    const list = Array.isArray(occasion) ? occasion : occasion.split(',');
    where.occasion = { hasSome: list };
  }

  if (fabric) {
    const list = Array.isArray(fabric) ? fabric : fabric.split(',');
    where.fabric = { hasSome: list };
  }

  if (rating) {
    where.avgRating = { gte: Number(rating) };
  }

  if (tags) {
    const list = Array.isArray(tags) ? tags : tags.split(',');
    where.tags = { hasSome: list };
  }

  if (featured === 'true') where.isFeatured = true;
  if (newArrivals === 'true') where.isNewArrival = true;

  if (search) {
    andFilters.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search.toLowerCase()] } },
      ],
    });
  }

  // Variant-based filtering
  const variantWhere = {};
  if (size) {
    const list = Array.isArray(size) ? size : size.split(',');
    variantWhere.size = { in: list };
  }
  if (color) {
    const list = Array.isArray(color) ? color : color.split(',');
    variantWhere.color = { in: list };
  }
  if (Object.keys(variantWhere).length > 0) {
    andFilters.push({ variants: { some: variantWhere } });
  }

  if (andFilters.length > 0) where.AND = andFilters;

  // Sort
  let orderBy = { createdAt: 'desc' };
  switch (sort) {
    case 'price_asc':
      orderBy = { price: 'asc' };
      break;
    case 'price_desc':
      orderBy = { price: 'desc' };
      break;
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'rating':
      orderBy = { avgRating: 'desc' };
      break;
    case 'popular':
      orderBy = { totalReviews: 'desc' };
      break;
    default:
      break;
  }

  const pageNum = Math.max(1, Number(page));
  const take = Math.max(1, Math.min(60, Number(limit)));
  const skip = (pageNum - 1) * take;

  return { where, orderBy, skip, take, pageNum, take_: take };
}

module.exports = { buildProductQuery };
