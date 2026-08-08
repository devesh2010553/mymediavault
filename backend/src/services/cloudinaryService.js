const cloudinary = require("cloudinary").v2;
const env = require("../config/env");

let configured = false;

/**
 * Cloudinary is the only place actual photo/video binaries live.
 * MongoDB only ever stores the identifiers/URLs Cloudinary hands back
 * (public_id, secure_url, resource_type, format, bytes, width/height,
 * duration) — never the media bytes themselves.
 *
 * This module is the single choke point for all Cloudinary calls so
 * nothing else in the backend needs the SDK or the API secret directly.
 */
function configureCloudinary() {
  if (configured) return;

  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) {
    const err = new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
    err.status = 500;
    err.publicMessage = "Media storage is not configured on the server.";
    throw err;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
}

// mediaType is our internal "photo" | "video" — map to Cloudinary's
// resource_type, which is what deletion and transformations key off of.
function resourceTypeFor(mediaType) {
  return mediaType === "video" ? "video" : "image";
}

/**
 * Uploads from a file path on disk (never a full in-memory buffer for
 * videos — see uploadController for why). Uses upload_large for video so
 * large files are sent to Cloudinary in chunks rather than held whole in
 * memory on either end.
 */
async function uploadFile(filePath, { mediaType, deviceId, folder }) {
  configureCloudinary();

  const resourceType = resourceTypeFor(mediaType);
  const uploadFolder = folder || `mymediavault/${deviceId}`;

  try {
    if (resourceType === "video") {
      return await cloudinary.uploader.upload_large(filePath, {
        resource_type: "video",
        folder: uploadFolder,
        chunk_size: 6 * 1024 * 1024, // 6MB chunks
      });
    }
    return await cloudinary.uploader.upload(filePath, {
      resource_type: "image",
      folder: uploadFolder,
    });
  } catch (err) {
    const wrapped = new Error(`Cloudinary upload failed: ${err.message}`);
    wrapped.status = 502;
    wrapped.publicMessage = "Upload to cloud storage failed. Please retry.";
    throw wrapped;
  }
}

/**
 * Deletes a Cloudinary asset. Photo and video assets live under different
 * resource_types in Cloudinary, so the caller must pass the resource_type
 * that was recorded on the Media document at upload time — using the
 * wrong one silently no-ops on Cloudinary's side instead of deleting.
 */
async function deleteAsset(publicId, resourceType) {
  configureCloudinary();

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType || "image",
      invalidate: true,
    });

    // Cloudinary returns { result: "ok" } on success, "not found" if the
    // asset is already gone (treated as success — nothing left to clean up),
    // or other strings on failure.
    if (result.result !== "ok" && result.result !== "not found") {
      const err = new Error(`Cloudinary deletion did not succeed: ${result.result}`);
      err.status = 502;
      err.publicMessage = "Failed to delete the cloud copy. The backup was not removed.";
      throw err;
    }
    return result;
  } catch (err) {
    if (err.status) throw err;
    const wrapped = new Error(`Cloudinary deletion failed: ${err.message}`);
    wrapped.status = 502;
    wrapped.publicMessage = "Failed to delete the cloud copy. The backup was not removed.";
    throw wrapped;
  }
}

// Dynamic thumbnail via Cloudinary transformation — no separate thumbnail
// asset is stored. For video, requesting a jpg format on a video public_id
// returns a poster frame.
function getThumbnailUrl(publicId, resourceType) {
  configureCloudinary();

  if (resourceType === "video") {
    return cloudinary.url(publicId, {
      resource_type: "video",
      format: "jpg",
      transformation: [{ width: 400, height: 400, crop: "fill" }, { quality: "auto" }],
      secure: true,
    });
  }

  return cloudinary.url(publicId, {
    resource_type: "image",
    transformation: [{ width: 400, height: 400, crop: "fill" }, { quality: "auto", fetch_format: "auto" }],
    secure: true,
  });
}

// Full-resolution/playback URL. For images this is just the stored
// secure_url; exposed here too so callers have one place to go through.
function getDeliveryUrl(publicId, resourceType) {
  configureCloudinary();
  return cloudinary.url(publicId, { resource_type: resourceType || "image", secure: true });
}

module.exports = {
  configureCloudinary,
  resourceTypeFor,
  uploadFile,
  deleteAsset,
  getThumbnailUrl,
  getDeliveryUrl,
};
