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
    storageKey: { type: String, required: true },
    thumbnailKey: { type: String },
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
