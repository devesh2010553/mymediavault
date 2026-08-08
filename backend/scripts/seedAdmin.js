// Usage: node scripts/seedAdmin.js
// Creates the single Admin document in MongoDB from ADMIN_EMAIL /
// ADMIN_PASSWORD_HASH env vars if one doesn't already exist.
require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../src/models/Admin");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !passwordHash) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD_HASH must be set in .env");
  }

  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log("Admin already exists:", email);
  } else {
    await Admin.create({ email: email.toLowerCase(), passwordHash });
    console.log("Admin created:", email);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
