const mongoose = require("mongoose");

// Single-admin model. In practice there should only ever be one document
// here, but we still model it as a collection for consistency and so a
// password change can be persisted without touching env vars at runtime.
const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
