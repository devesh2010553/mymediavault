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
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// Admin (website)
router.post("/pairing-code", requireAdmin, asyncHandler(generatePairingCode));
router.get("/", requireAdmin, asyncHandler(listDevices));
router.get("/:id", requireAdmin, asyncHandler(getDevice));
router.post("/:id/revoke", requireAdmin, asyncHandler(revokeDevice));

// Device (APK) — pairing itself is unauthenticated (that's the point of the code)
router.post("/register", pairingLimiter, asyncHandler(pairDevice));
router.post("/:id/heartbeat", requireDevice, asyncHandler(heartbeat));

module.exports = router;
