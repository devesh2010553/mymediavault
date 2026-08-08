/**
 * StorageService is a provider-agnostic abstraction. MongoDB only ever
 * stores a `storageKey` string; this service is the only code that knows
 * how to turn that key into actual bytes.
 *
 * Implementations must provide: upload, download, delete, exists, getSignedUrl
 */
class StorageService {
  async upload(_key, _bufferOrStream, _contentType) {
    throw new Error("not implemented");
  }
  async download(_key) {
    throw new Error("not implemented");
  }
  async delete(_key) {
    throw new Error("not implemented");
  }
  async exists(_key) {
    throw new Error("not implemented");
  }
  async getSignedUrl(_key, _expiresInSeconds) {
    throw new Error("not implemented");
  }
}

module.exports = StorageService;
