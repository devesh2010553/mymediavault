const mongoose = require("mongoose");

// Short-lived, single-use pairing codes. TTL index auto-removes expired
// documents so codes are never reused and never linger in the DB.
const pairingCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // hard backstop TTL
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model("PairingCode", pairingCodeSchema);
