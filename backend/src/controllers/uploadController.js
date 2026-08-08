const fs = require("fs");
const crypto = require("crypto");
const Media = require("../models/Media");
const cloudinaryService = require("../services/cloudinaryService");

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

function cleanupTempFile(filePath) {
  if (!filePath) return;
  fs.unlink(filePath, () => {}); // best-effort, never block the response on this
}

// Called by the Android app to upload a media file plus its metadata.
// De-dupes on (deviceId, androidMediaId) and (deviceId, checksum).
//
// File contract with Android is unchanged: multipart "file" plus filename,
// mimeType, mediaType, width, height, duration, createdAt, modifiedAt,
// androidMediaId form fields. Only the server-side storage backend changed.
//
// Multer writes the upload to a temp file on disk (see mediaRoutes.js)
// rather than buffering it in memory, so large videos don't blow up
// server RAM. The temp file is always cleaned up, whether the upload
// succeeds, is deduped, or fails.
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
    cleanupTempFile(file.path);
    return res.status(400).json({ error: "filename, mimeType, mediaType are required" });
  }
  if (!["photo", "video"].includes(mediaType)) {
    cleanupTempFile(file.path);
    return res.status(400).json({ error: "mediaType must be 'photo' or 'video'" });
  }

  try {
    const checksum = await hashFile(file.path);

    const existing = await Media.findOne({
      deviceId: device._id,
      $or: [{ androidMediaId }, { checksum }],
    });
    if (existing) {
      cleanupTempFile(file.path);
      return res.status(200).json({ item: existing, deduped: true });
    }

    // Upload to Cloudinary first. If this throws, we return the error and
    // never create a Mongo record — there must never be a Media document
    // that points at an asset that doesn't actually exist in Cloudinary.
    const cloudinaryResult = await cloudinaryService.uploadFile(file.path, {
      mediaType,
      deviceId: device._id.toString(),
    });

    cleanupTempFile(file.path);

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
      cloudinaryPublicId: cloudinaryResult.public_id,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryResourceType: cloudinaryResult.resource_type,
      cloudinaryFormat: cloudinaryResult.format,
      cloudinaryBytes: cloudinaryResult.bytes,
      cloudinaryWidth: cloudinaryResult.width,
      cloudinaryHeight: cloudinaryResult.height,
      cloudinaryDuration: cloudinaryResult.duration,
      androidMediaId,
      backupStatus: "completed",
      phoneStatus: "present",
    });

    device.lastSyncAt = new Date();
    await device.save();

    return res.status(201).json({ item, deduped: false });
  } catch (err) {
  cleanupTempFile(file.path);

  console.error("MEDIA UPLOAD FAILED:", {
    message: err.message,
    stack: err.stack,
    status: err.status,
    publicMessage: err.publicMessage,
  });

  const status = err.status || 500;

  return res.status(status).json({
    error: err.publicMessage || err.message || "Upload failed",
  });
}
}

module.exports = { uploadMedia };
