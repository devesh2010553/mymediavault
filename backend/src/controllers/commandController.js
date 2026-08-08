const Command = require("../models/Command");
const Media = require("../models/Media");
const { createCommand, requestDeletion } = require("../services/commandService");

// Admin -> creates a command for a device (e.g. SYNC_NOW, or deletion via requestDeletion below)
async function createCommandForDevice(req, res) {
  const { deviceId, type, mediaIds } = req.body;
  if (!deviceId || !type) return res.status(400).json({ error: "deviceId and type are required" });

  const command = await createCommand(deviceId, type, mediaIds || []);
  res.status(201).json({ command });
}

// Admin -> unified deletion endpoint implementing the "3 buttons" from the spec:
// mode: "phone" | "cloud" | "both"
async function requestMediaDeletion(req, res) {
  const { deviceId, mediaIds, mode } = req.body;
  if (!deviceId || !Array.isArray(mediaIds) || !mode) {
    return res.status(400).json({ error: "deviceId, mediaIds[], and mode are required" });
  }
  if (!["phone", "cloud", "both"].includes(mode)) {
    return res.status(400).json({ error: "mode must be phone, cloud, or both" });
  }

  const result = await requestDeletion(deviceId, mediaIds, mode);
  res.json({ ok: true, result });
}

async function listCommands(req, res) {
  const { deviceId, status } = req.query;
  const query = {};
  if (deviceId) query.deviceId = deviceId;
  if (status) query.status = status;
  const commands = await Command.find(query).sort({ createdAt: -1 }).limit(200);
  res.json({ commands });
}

// Device -> polls for its own pending commands only.
async function listCommandsForDevice(req, res) {
  const device = req.device;
  if (req.params.id !== device._id.toString()) {
    return res.status(403).json({ error: "Cannot access another device's commands" });
  }

  const now = new Date();
  const commands = await Command.find({
    deviceId: device._id,
    status: "pending",
    expiresAt: { $gt: now },
  });

  await Command.updateMany(
    { _id: { $in: commands.map((c) => c._id) } },
    { $set: { status: "sent" } }
  );

  res.json({ commands });
}

// Device -> reports the result of executing a command.
async function reportCommandResult(req, res) {
  const device = req.device;
  const { status, result } = req.body;

  const command = await Command.findById(req.params.id);
  if (!command) return res.status(404).json({ error: "Command not found" });
  if (command.deviceId.toString() !== device._id.toString()) {
    return res.status(403).json({ error: "Cannot report results for another device's command" });
  }

  command.status = status || "completed";
  command.result = result || null;
  command.processedAt = new Date();
  await command.save();

  if (command.type === "DELETE_PHONE_MEDIA" && command.status === "completed") {
    await Media.updateMany(
      { _id: { $in: command.mediaIds } },
      { $set: { phoneStatus: "deleted" } }
    );
  }

  res.json({ ok: true });
}

module.exports = {
  createCommandForDevice,
  requestMediaDeletion,
  listCommands,
  listCommandsForDevice,
  reportCommandResult,
};
