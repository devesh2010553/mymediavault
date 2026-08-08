const express = require("express");
const { login, logout, me } = require("../controllers/authController");
const { requireAdmin } = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimiters");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.post("/login", loginLimiter, asyncHandler(login));
router.post("/logout", requireAdmin, asyncHandler(logout));
router.get("/me", requireAdmin, asyncHandler(me));

module.exports = router;
