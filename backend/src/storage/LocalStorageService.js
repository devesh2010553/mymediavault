const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const StorageService = require("./StorageService");

// Simple filesystem-backed storage for local development. NOT suitable
// for Render's ephemeral filesystem in production — use S3StorageService
// (or any other real object storage) in production instead.
class LocalStorageService extends StorageService {
  constructor(rootDir) {
    super();
    this.root = rootDir || path.join(__dirname, "..", "..", "uploads");
  }

  _fullPath(key) {
    const safe = path.normalize(key).replace(/^(\.\.[\/\\])+/, "");
    return path.join(this.root, safe);
  }

  async upload(key, bufferOrStream) {
    const full = this._fullPath(key);
    await fsp.mkdir(path.dirname(full), { recursive: true });
    if (Buffer.isBuffer(bufferOrStream)) {
      await fsp.writeFile(full, bufferOrStream);
    } else {
      await new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(full);
        bufferOrStream.pipe(ws);
        ws.on("finish", resolve);
        ws.on("error", reject);
      });
    }
    return key;
  }

  async download(key) {
    return fs.createReadStream(this._fullPath(key));
  }

  async delete(key) {
    try {
      await fsp.unlink(this._fullPath(key));
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }

  async exists(key) {
    try {
      await fsp.access(this._fullPath(key));
      return true;
    } catch {
      return false;
    }
  }

  // Local dev "signed URL" — just a route the API serves directly, gated
  // by admin auth middleware. Not a real signed URL scheme.
  async getSignedUrl(key) {
    return `/api/media/local-file/${encodeURIComponent(key)}`;
  }
}

module.exports = LocalStorageService;
