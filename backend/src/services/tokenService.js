const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");

function signAdminAccessToken(admin) {
  return jwt.sign({ sub: admin._id.toString(), email: admin.email, type: "admin" }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function signAdminRefreshToken(admin) {
  return jwt.sign({ sub: admin._id.toString(), type: "admin_refresh" }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });
}

function signDeviceToken(device) {
  return jwt.sign({ sub: device._id.toString(), type: "device" }, env.jwtSecret, {
    expiresIn: env.deviceTokenExpiresIn,
  });
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = { signAdminAccessToken, signAdminRefreshToken, signDeviceToken, hashToken };
