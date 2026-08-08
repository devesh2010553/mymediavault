const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    name: { type: String, default: "My Android Phone" },
    deviceTokenHash: { type: String, required: true }, // hashed, never store raw token
    androidVersion: { type: String },
    model: { type: String },
    manufacturer: { type: String },
    batteryLevel: { type: Number, default: null },
    backupEnabled: { type: Boolean, default: true },
    wifiOnly: { type: Boolean, default: true },
    chargingOnly: { type: Boolean, default: false },
    status: { type: String, enum: ["online", "offline"], default: "offline" },
    lastHeartbeatAt: { type: Date, default: null },
    lastSyncAt: { type: Date, default: null },
    revoked: { type: Boolean, default: false },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Device", deviceSchema);
