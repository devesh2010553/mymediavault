const mongoose = require("mongoose");

const commandSchema = new mongoose.Schema(
  {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true, index: true },
    type: {
      type: String,
      enum: ["SYNC_NOW", "DELETE_PHONE_MEDIA", "DELETE_CLOUD_MEDIA", "DELETE_BOTH", "REQUEST_DEVICE_STATUS"],
      required: true,
    },
    mediaIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],
    status: {
      type: String,
      enum: ["pending", "sent", "waiting_confirmation", "completed", "failed", "cancelled", "expired"],
      default: "pending",
      index: true,
    },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    expiresAt: { type: Date, required: true },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Command", commandSchema);
