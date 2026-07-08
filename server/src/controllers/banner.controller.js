const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const { fileToDataUrl } = require('../middleware/upload.middleware');
const { mapBanner, mapBanners } = require('../utils/imageUrls');

// Never select the base64 blobs for lists — responses carry
// /api/images/banner/<id>?v=<updatedAt> links instead (utils/imageUrls.js).
const bannerSelect = {
  id: true,
  title: true,
  subtitle: true,
  link: true,
  position: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

// GET /api/banners
const listActiveBanners = asyncHandler(async (req, res) => {
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { position: 'asc' },
    select: bannerSelect,
  });
  res.json({ success: true, banners: mapBanners(banners) });
});

// -------------------- ADMIN --------------------

function resolveImage(req) {
  if (req.file) return fileToDataUrl(req.file);
  if (typeof req.body?.image === 'string' && req.body.image.startsWith('data:image/')) {
    return req.body.image;
  }
  return null;
}

const listAllBanners = asyncHandler(async (req, res) => {
  const banners = await prisma.banner.findMany({
    orderBy: { position: 'asc' },
    select: bannerSelect,
  });
  res.json({ success: true, banners: mapBanners(banners) });
});

const createBanner = asyncHandler(async (req, res) => {
  const { title, subtitle, link, position, isActive } = req.body;
  if (!title) throw new ApiError(400, 'title is required');

  const image = resolveImage(req);
  if (!image) throw new ApiError(400, 'image is required');

  const banner = await prisma.banner.create({
    data: {
      title,
      subtitle,
      link,
      position: Number(position || 0),
      isActive: isActive !== 'false',
      image,
    },
  });
  res.status(201).json({ success: true, banner: mapBanner(banner) });
});

const updateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Banner not found');

  const data = { ...req.body };
  // Never let the raw body `image` field (which may be the current string) overwrite
  // unless it's actually a new base64 data URL.
  delete data.image;

  if (data.position !== undefined) data.position = Number(data.position);
  if (data.isActive !== undefined) data.isActive = data.isActive === true || data.isActive === 'true';

  const image = resolveImage(req);
  if (image) data.image = image;

  const banner = await prisma.banner.update({ where: { id }, data });
  res.json({ success: true, banner: mapBanner(banner) });
});

const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Banner not found');
  await prisma.banner.delete({ where: { id } });
  res.json({ success: true, message: 'Banner deleted' });
});

module.exports = { listActiveBanners, listAllBanners, createBanner, updateBanner, deleteBanner };
