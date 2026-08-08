const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const { signAdminAccessToken, signAdminRefreshToken } = require("../services/tokenService");

const MAX_FAILED_ATTEMPTS = 6;
const LOCK_DURATION_MS = 15 * 60 * 1000;

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (!admin) {
    // Same generic message as invalid password — don't leak which part was wrong.
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    return res.status(423).json({ error: "Account temporarily locked. Try again later." });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    admin.failedLoginAttempts += 1;
    if (admin.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      admin.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      admin.failedLoginAttempts = 0;
    }
    await admin.save();
    return res.status(401).json({ error: "Invalid credentials" });
  }

  admin.failedLoginAttempts = 0;
  admin.lockedUntil = null;
  admin.lastLoginAt = new Date();
  await admin.save();

  const accessToken = signAdminAccessToken(admin);
  const refreshToken = signAdminRefreshToken(admin);

  res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    .json({ accessToken, admin: { email: admin.email } });
}

function logout(_req, res) {
  res.clearCookie("accessToken").clearCookie("refreshToken").json({ ok: true });
}

async function me(req, res) {
  res.json({ admin: req.admin });
}

module.exports = { login, logout, me };
