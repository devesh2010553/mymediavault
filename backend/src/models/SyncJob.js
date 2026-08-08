const mongoose = require("mongoose");

const syncJobSchema = new mongoose.Schema(
  {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true, index: true },
    status: {
      type: String,
      enum: ["scanning", "uploading", "completed", "failed", "cancelled"],
      default: "scanning",
    },
    totalScanned: { type: Number, default: 0 },
    totalToUpload: { type: Number, default: 0 },
    totalUploaded: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SyncJob", syncJobSchema);
