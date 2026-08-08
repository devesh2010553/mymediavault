const bcrypt = require("bcryptjs");
const Device = require("../models/Device");
const { consumePairingCode } = require("../services/pairingService");
const { createPairingCode } = require("../services/pairingService");
const { signDeviceToken, hashToken } = require("../services/tokenService");

async function generatePairingCode(_req, res) {
  const { code, expiresAt } = await createPairingCode();
  res.json({ code, expiresAt });
}

// Called by the APK with the code the admin sees on the website.
async function pairDevice(req, res) {
  const { code, deviceInfo } = req.body;
  if (!code) return res.status(400).json({ error: "Pairing code is required" });

  const record = await consumePairingCode(code);
  if (!record) return res.status(400).json({ error: "Invalid or expired pairing code" });

  const device = await Device.create({
    name: deviceInfo?.name || "My Android Phone",
    androidVersion: deviceInfo?.androidVersion,
    model: deviceInfo?.model,
    manufacturer: deviceInfo?.manufacturer,
    deviceTokenHash: "pending", // set right after, once we have the signed token
    status: "online",
    lastHeartbeatAt: new Date(),
  });

  const token = signDeviceToken(device);
  device.deviceTokenHash = hashToken(token);
  await device.save();

  res.json({ deviceId: device._id, deviceToken: token });
}

async function listDevices(_req, res) {
  const devices = await Device.find().sort({ createdAt: -1 });
  res.json({ devices });
}

async function getDevice(req, res) {
  const device = await Device.findById(req.params.id);
  if (!device) return res.status(404).json({ error: "Device not found" });
  res.json({ device });
}

async function revokeDevice(req, res) {
  const device = await Device.findById(req.params.id);
  if (!device) return res.status(404).json({ error: "Device not found" });
  device.revoked = true;
  device.revokedAt = new Date();
  await device.save();
  res.json({ ok: true });
}

async function heartbeat(req, res) {
  const device = req.device;
  const { batteryLevel } = req.body;
  device.status = "online";
  device.lastHeartbeatAt = new Date();
  if (typeof batteryLevel === "number") device.batteryLevel = batteryLevel;
  await device.save();
  res.json({ ok: true });
}

module.exports = { generatePairingCode, pairDevice, listDevices, getDevice, revokeDevice, heartbeat };
