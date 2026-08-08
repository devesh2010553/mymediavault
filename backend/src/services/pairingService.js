const crypto = require("crypto");
const PairingCode = require("../models/PairingCode");
const env = require("../config/env");

function generateCode() {
  // 6-digit numeric code, easy to type on a phone
  return crypto.randomInt(100000, 999999).toString();
}

async function createPairingCode() {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + env.pairingCodeTtlSeconds * 1000);
  await PairingCode.create({ code, expiresAt });
  return { code, expiresAt };
}

async function consumePairingCode(code) {
  const record = await PairingCode.findOne({ code, used: false });
  if (!record) return null;
  if (record.expiresAt < new Date()) return null;

  record.used = true;
  await record.save();
  return record;
}

module.exports = { createPairingCode, consumePairingCode };
