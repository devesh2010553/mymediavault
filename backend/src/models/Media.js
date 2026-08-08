const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true, index: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    mediaType: { type: String, enum: ["photo", "video"], required: true, index: true },
    size: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number }, // seconds, for video
    createdAt: { type: Date }, // original media creation time (from device)
    modifiedAt: { type: Date },
    checksum: { type: String, index: true }, // sha256, used for de-dup

    // Cloudinary is the only place the actual media binary lives. These
    // fields are exactly what Cloudinary's upload response returns, so
    // MongoDB never needs to store or re-derive anything about the asset
    // beyond what Cloudinary already told us.
    cloudinaryPublicId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true }, // secure_url
    cloudinaryResourceType: { type: String, enum: ["image", "video"], required: true },
    cloudinaryFormat: { type: String },
    cloudinaryBytes: { type: Number },
    cloudinaryWidth: { type: Number },
    cloudinaryHeight: { type: Number },
    cloudinaryDuration: { type: Number }, // seconds, video only

    androidMediaId: { type: String, index: true }, // MediaStore _ID on device
    backupStatus: {
      type: String,
      enum: ["pending", "uploading", "completed", "failed"],
      default: "pending",
    },
    phoneStatus: {
      type: String,
      enum: ["present", "not_found", "delete_pending", "deleted"],
      default: "present",
    },
    createdOnServer: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

mediaSchema.index({ deviceId: 1, androidMediaId: 1 }, { unique: true, sparse: true });
mediaSchema.index({ deviceId: 1, checksum: 1 });
mediaSchema.index({ filename: "text" });

module.exports = mongoose.model("Media", mediaSchema);
