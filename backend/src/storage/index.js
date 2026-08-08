const env = require("../config/env");
const LocalStorageService = require("./LocalStorageService");

let instance = null;

// Factory — the rest of the app calls getStorage() and never imports a
// concrete provider directly. Swapping providers is a single env var.
function getStorage() {
  if (instance) return instance;

  if (env.storageProvider === "s3") {
    const S3StorageService = require("./S3StorageService");
    instance = new S3StorageService();
  } else {
    instance = new LocalStorageService();
  }
  return instance;
}

module.exports = { getStorage };
