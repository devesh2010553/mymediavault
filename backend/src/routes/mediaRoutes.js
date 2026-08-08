const express = require("express");
const multer = require("multer");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const {
  listMedia,
  getMedia,
  getMediaUrl,
  deleteMedia,
  bulkDelete,
} = require("../controllers/mediaController");
const { uploadMedia } = require("../controllers/uploadController");
const { requireAdmin, requireDevice } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// Disk storage (not memoryStorage) so large videos are streamed to a temp
// file instead of being held fully in RAM. The temp file is uploaded to
// Cloudinary and then deleted (see uploadController).
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename: (_req, file, cb) => {
      const unique = crypto.randomBytes(8).toString("hex");
      cb(null, `mmv-upload-${Date.now()}-${unique}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB cap per file
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|webp|heic|heif)$|^video\/(mp4|3gpp|quicktime|x-matroska)$/;
    if (!allowed.test(file.mimetype)) return cb(new Error("Unsupported file type"));
    cb(null, true);
  },
});

// Wraps multer's upload to turn its errors (file-too-large, bad type) into
// the same JSON error shape the rest of the API uses, instead of Express's
// default HTML error page.
function handleUpload(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File exceeds the 500MB upload limit" });
    }
    return res.status(400).json({ error: err.message || "Upload rejected" });
  });
}

// Admin (website)
router.get("/", requireAdmin, asyncHandler(listMedia));
router.get("/:id", requireAdmin, asyncHandler(getMedia));
router.get("/:id/url", requireAdmin, asyncHandler(getMediaUrl));
router.delete("/:id", requireAdmin, asyncHandler(deleteMedia));
router.post("/bulk-delete", requireAdmin, asyncHandler(bulkDelete));

// Device (APK)
router.post("/upload", requireDevice, handleUpload, asyncHandler(uploadMedia));

module.exports = router;
