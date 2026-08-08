const jwt = require("jsonwebtoken");
const env = require("../config/env");
const Device = require("../models/Device");

// Requires a valid admin-issued JWT access token (website / PC sessions).
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.cookies?.accessToken;

  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload.type !== "admin") throw new Error("wrong token type");
    req.admin = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

// Requires a valid device token (Android app requests). Loads the device
// and rejects revoked devices so a revoked phone can never act again.
async function requireDevice(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload.type !== "device") throw new Error("wrong token type");

    const device = await Device.findById(payload.sub);
    if (!device || device.revoked) {
      return res.status(401).json({ error: "Device access revoked" });
    }

    req.device = device;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired device token" });
  }
}

module.exports = { requireAdmin, requireDevice };
