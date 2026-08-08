const crypto = require("crypto");
const Media = require("../models/Media");
const { getStorage } = require("../storage");

// Called by the Android app to upload a media file plus its metadata.
// De-dupes on (deviceId, androidMediaId) and (deviceId, checksum).
async function uploadMedia(req, res) {
  const device = req.device;
  const file = req.file;
  if (!file) return res.status(400).json({ error: "File is required" });

  const {
    filename,
    mimeType,
    mediaType,
    width,
    height,
    duration,
    createdAt,
    modifiedAt,
    androidMediaId,
  } = req.body;

  if (!filename || !mimeType || !mediaType) {
    return res.status(400).json({ error: "filename, mimeType, mediaType are required" });
  }

  const checksum = crypto.createHash("sha256").update(file.buffer).digest("hex");

  const existing = await Media.findOne({
    deviceId: device._id,
    $or: [{ androidMediaId }, { checksum }],
  });
  if (existing) {
    return res.status(200).json({ item: existing, deduped: true });
  }

  const storageKey = `devices/${device._id}/${Date.now()}-${filename}`;
  const storage = getStorage();
  await storage.upload(storageKey, file.buffer, mimeType);

  const item = await Media.create({
    deviceId: device._id,
    filename,
    mimeType,
    mediaType,
    size: file.size,
    width: width ? parseInt(width, 10) : undefined,
    height: height ? parseInt(height, 10) : undefined,
    duration: duration ? parseFloat(duration) : undefined,
    createdAt: createdAt ? new Date(createdAt) : undefined,
    modifiedAt: modifiedAt ? new Date(modifiedAt) : undefined,
    checksum,
    storageKey,
    androidMediaId,
    backupStatus: "completed",
    phoneStatus: "present",
  });

  device.lastSyncAt = new Date();
  await device.save();

  res.status(201).json({ item, deduped: false });
}

module.exports = { uploadMedia };
