const Command = require("../models/Command");
const Media = require("../models/Media");
const cloudinaryService = require("./cloudinaryService");

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
// delete and vice versa. Deleting a cloud copy here NEVER deletes the
// Android gallery copy, and requesting phone deletion NEVER deletes the
// Cloudinary backup — each branch below is fully independent.
async function requestDeletion(deviceId, mediaIds, mode) {
  const results = { cloudDeleted: [], cloudFailed: [], phoneCommand: null };

  if (mode === "cloud" || mode === "both") {
    const items = await Media.find({ _id: { $in: mediaIds } });
    for (const item of items) {
      try {
        await cloudinaryService.deleteAsset(item.cloudinaryPublicId, item.cloudinaryResourceType);
        await Media.deleteOne({ _id: item._id });
        results.cloudDeleted.push(item._id);
      } catch (err) {
        // Never remove the Mongo record if Cloudinary deletion failed.
        results.cloudFailed.push({ id: item._id, error: err.publicMessage || "Cloudinary deletion failed" });
      }
    }
  }

  if (mode === "phone" || mode === "both") {
    results.phoneCommand = await createCommand(deviceId, "DELETE_PHONE_MEDIA", mediaIds);
    await Media.updateMany({ _id: { $in: mediaIds } }, { $set: { phoneStatus: "delete_pending" } });
  }

  return results;
}

module.exports = { createCommand, requestDeletion };
