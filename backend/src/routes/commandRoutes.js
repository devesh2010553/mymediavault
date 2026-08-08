const express = require("express");
const {
  createCommandForDevice,
  requestMediaDeletion,
  listCommands,
  listCommandsForDevice,
  reportCommandResult,
} = require("../controllers/commandController");
const { requireAdmin, requireDevice } = require("../middleware/auth");

const router = express.Router();

// Admin (website)
router.get("/", requireAdmin, listCommands);
router.post("/", requireAdmin, createCommandForDevice);
router.post("/delete-request", requireAdmin, requestMediaDeletion);

// Device (APK)
router.get("/device/:id", requireDevice, listCommandsForDevice);
router.post("/:id/result", requireDevice, reportCommandResult);

module.exports = router;
