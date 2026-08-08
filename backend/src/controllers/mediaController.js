const Media = require("../models/Media");
const { getStorage } = require("../storage");

// Paginated + filterable listing. Never returns full binaries — only
// metadata plus a short-lived signed URL, generated on demand.
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

  const [items, total] = await Promise.all([
    Media.find(query)
      .sort({ [sortBy]: sortDir === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    Media.countDocuments(query),
  ]);

  res.json({ items, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
}

async function getMedia(req, res) {
  const item = await Media.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Media not found" });
  res.json({ item });
}

async function getMediaUrl(req, res) {
  const item = await Media.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Media not found" });

  const storage = getStorage();
  const url = await storage.getSignedUrl(item.storageKey, 3600);
  const thumbnailUrl = item.thumbnailKey ? await storage.getSignedUrl(item.thumbnailKey, 3600) : null;

  res.json({ url, thumbnailUrl });
}

async function deleteMedia(req, res) {
  const item = await Media.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Media not found" });

  const storage = getStorage();
  await storage.delete(item.storageKey);
  if (item.thumbnailKey) await storage.delete(item.thumbnailKey);
  await Media.deleteOne({ _id: item._id });

  res.json({ ok: true });
}

async function bulkDelete(req, res) {
  const { mediaIds } = req.body;
  if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
    return res.status(400).json({ error: "mediaIds array is required" });
  }

  const storage = getStorage();
  const items = await Media.find({ _id: { $in: mediaIds } });
  for (const item of items) {
    await storage.delete(item.storageKey);
    if (item.thumbnailKey) await storage.delete(item.thumbnailKey);
  }
  await Media.deleteMany({ _id: { $in: mediaIds } });

  res.json({ ok: true, deletedCount: items.length });
}

// Serves local-storage files directly. Only reachable behind requireAdmin
// (or requireDevice for device-originated fetches), and only used when
// STORAGE_PROVIDER=local for development.
async function serveLocalFile(req, res) {
  const storage = getStorage();
  const key = decodeURIComponent(req.params.key);
  if (!(await storage.exists(key))) return res.status(404).end();
  const stream = await storage.download(key);
  stream.pipe(res);
}

module.exports = { listMedia, getMedia, getMediaUrl, deleteMedia, bulkDelete, serveLocalFile };
