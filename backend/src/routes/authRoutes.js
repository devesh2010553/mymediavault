const express = require("express");
const { login, logout, me } = require("../controllers/authController");
const { requireAdmin } = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/login", loginLimiter, login);
router.post("/logout", requireAdmin, logout);
router.get("/me", requireAdmin, me);

module.exports = router;
