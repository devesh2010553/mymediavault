const express = require("express");
const {
  createCommandForDevice,
  requestMediaDeletion,
  listCommands,
  listCommandsForDevice,
  reportCommandResult,
} = require("../controllers/commandController");
const { requireAdmin, requireDevice } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// Admin (website)
router.get("/", requireAdmin, asyncHandler(listCommands));
router.post("/", requireAdmin, asyncHandler(createCommandForDevice));
router.post("/delete-request", requireAdmin, asyncHandler(requestMediaDeletion));

// Device (APK)
router.get("/device/:id", requireDevice, asyncHandler(listCommandsForDevice));
router.post("/:id/result", requireDevice, asyncHandler(reportCommandResult));

module.exports = router;
