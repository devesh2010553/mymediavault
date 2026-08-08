const express = require("express");
const multer = require("multer");
const {
  listMedia,
  getMedia,
  getMediaUrl,
  deleteMedia,
  bulkDelete,
  serveLocalFile,
} = require("../controllers/mediaController");
const { uploadMedia } = require("../controllers/uploadController");
const { requireAdmin, requireDevice } = require("../middleware/auth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB cap per file
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|webp|heic|heif)$|^video\/(mp4|3gpp|quicktime|x-matroska)$/;
    if (!allowed.test(file.mimetype)) return cb(new Error("Unsupported file type"));
    cb(null, true);
  },
});

// Admin (website)
router.get("/", requireAdmin, listMedia);
router.get("/local-file/:key", requireAdmin, serveLocalFile);
router.get("/:id", requireAdmin, getMedia);
router.get("/:id/url", requireAdmin, getMediaUrl);
router.delete("/:id", requireAdmin, deleteMedia);
router.post("/bulk-delete", requireAdmin, bulkDelete);

// Device (APK)
router.post("/upload", requireDevice, upload.single("file"), uploadMedia);

module.exports = router;
