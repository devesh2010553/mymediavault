const Media = require("../models/Media");
const cloudinaryService = require("../services/cloudinaryService");

// Paginated + filterable listing. Never returns full binaries — only
// metadata plus the Cloudinary URLs already stored on the document.
async function listMedia(req, res) {
  const {
    page = 1,
    limit = 60,
    mediaType,
    search,
    sortBy = "createdOnServer",
    sortDir = "desc",
  } = req.query;

  const query = {};
  if (mediaType) query.mediaType = mediaType;
  if (search) query.$text = { $search: search };

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

  const [items, total, storageStats] = await Promise.all([
    Media.find(query)
      .sort({ [sortBy]: sortDir === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    Media.countDocuments(query),
    Media.aggregate([{ $group: { _id: null, totalBytes: { $sum: "$cloudinaryBytes" } } }]),
  ]);

  // Thumbnails are generated on the fly via Cloudinary transformations —
  // no separate thumbnail asset is uploaded or stored.
  const itemsWithThumbnails = items.map((item) => ({
    ...item.toObject(),
    thumbnailUrl: cloudinaryService.getThumbnailUrl(item.cloudinaryPublicId, item.cloudinaryResourceType),
  }));

  res.json({
    items: itemsWithThumbnails,
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalStorageBytes: storageStats[0]?.totalBytes || 0,
  });
}

async function getMedia(req, res) {
  const item = await Media.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Media not found" });
  res.json({ item });
}

// Returns the playback/full-resolution URL plus a dynamically generated
// thumbnail URL. Both come from Cloudinary transformations — nothing is
// re-downloaded or re-uploaded to produce them.
async function getMediaUrl(req, res) {
  const item = await Media.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Media not found" });

  const url = item.cloudinaryUrl;
  const thumbnailUrl = cloudinaryService.getThumbnailUrl(item.cloudinaryPublicId, item.cloudinaryResourceType);

  res.json({ url, thumbnailUrl });
}

// "Delete cloud copy" — deletes the Cloudinary asset, then removes the
// Mongo record. If Cloudinary deletion fails, the Mongo record is left
// untouched so the backup is never silently lost from tracking.
async function deleteMedia(req, res) {
  const item = await Media.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Media not found" });

  await cloudinaryService.deleteAsset(item.cloudinaryPublicId, item.cloudinaryResourceType);
  // Only reached if deleteAsset succeeded (or the asset was already gone) —
  // deleteAsset throws on real failure, which propagates to errorHandler.
  await Media.deleteOne({ _id: item._id });

  res.json({ ok: true });
}

async function bulkDelete(req, res) {
  const { mediaIds } = req.body;
  if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
    return res.status(400).json({ error: "mediaIds array is required" });
  }

  const items = await Media.find({ _id: { $in: mediaIds } });
  const deletedIds = [];
  const failed = [];

  for (const item of items) {
    try {
      await cloudinaryService.deleteAsset(item.cloudinaryPublicId, item.cloudinaryResourceType);
      deletedIds.push(item._id);
    } catch (err) {
      // Never remove the Mongo record for an item whose Cloudinary
      // deletion failed — leave it intact and report it back.
      failed.push({ id: item._id, error: err.publicMessage || "Cloudinary deletion failed" });
    }
  }

  if (deletedIds.length > 0) {
    await Media.deleteMany({ _id: { $in: deletedIds } });
  }

  res.json({ ok: failed.length === 0, deletedCount: deletedIds.length, failed });
}

module.exports = { listMedia, getMedia, getMediaUrl, deleteMedia, bulkDelete };
