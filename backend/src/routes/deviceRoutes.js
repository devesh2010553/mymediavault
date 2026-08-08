const express = require("express");
const {
  generatePairingCode,
  pairDevice,
  listDevices,
  getDevice,
  revokeDevice,
  heartbeat,
} = require("../controllers/deviceController");
const { requireAdmin, requireDevice } = require("../middleware/auth");
const { pairingLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

// Admin (website)
router.post("/pairing-code", requireAdmin, generatePairingCode);
router.get("/", requireAdmin, listDevices);
router.get("/:id", requireAdmin, getDevice);
router.post("/:id/revoke", requireAdmin, revokeDevice);

// Device (APK) — pairing itself is unauthenticated (that's the point of the code)
router.post("/register", pairingLimiter, pairDevice);
router.post("/:id/heartbeat", requireDevice, heartbeat);

module.exports = router;
