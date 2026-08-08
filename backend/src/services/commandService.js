const Command = require("../models/Command");
const Media = require("../models/Media");

const COMMAND_TTL_MS = 24 * 60 * 60 * 1000;

async function createCommand(deviceId, type, mediaIds = []) {
  return Command.create({
    deviceId,
    type,
    mediaIds,
    expiresAt: new Date(Date.now() + COMMAND_TTL_MS),
  });
}

// Called from the website when the admin requests deletion. Splits the
// single user action into the correct set of independent commands/effects,
// per the "backup independence" rule: cloud delete never implies phone
// delete and vice versa.
async function requestDeletion(deviceId, mediaIds, mode) {
  const results = { cloudDeleted: [], phoneCommand: null };

  if (mode === "cloud" || mode === "both") {
    const storageModule = require("../storage");
    const storage = storageModule.getStorage();
    const items = await Media.find({ _id: { $in: mediaIds } });
    for (const item of items) {
      await storage.delete(item.storageKey);
      if (item.thumbnailKey) await storage.delete(item.thumbnailKey);
      await Media.deleteOne({ _id: item._id });
      results.cloudDeleted.push(item._id);
    }
  }

  if (mode === "phone" || mode === "both") {
    results.phoneCommand = await createCommand(deviceId, "DELETE_PHONE_MEDIA", mediaIds);
    await Media.updateMany({ _id: { $in: mediaIds } }, { $set: { phoneStatus: "delete_pending" } });
  }

  return results;
}

module.exports = { createCommand, requestDeletion };
