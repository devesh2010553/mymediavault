/**
 * S3-compatible storage (AWS S3, Cloudflare R2, Backblaze B2, MinIO, etc.)
 * Requires: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 *
 * This is intentionally kept separate from LocalStorageService so the rest
 * of the backend never needs to know which provider is active — only
 * services/storageFactory.js picks between them, based on STORAGE_PROVIDER.
 */
const StorageService = require("./StorageService");
const env = require("../config/env");

class S3StorageService extends StorageService {
  constructor() {
    super();
    const { S3Client } = require("@aws-sdk/client-s3");
    this.bucket = env.storage.bucket;
    this.client = new S3Client({
      region: env.storage.region,
      endpoint: env.storage.endpoint || undefined,
      credentials: {
        accessKeyId: env.storage.accessKey,
        secretAccessKey: env.storage.secretKey,
      },
      forcePathStyle: !!env.storage.endpoint, // needed for R2/B2/MinIO
    });
  }

  async upload(key, bufferOrStream, contentType) {
    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: bufferOrStream,
        ContentType: contentType || "application/octet-stream",
      })
    );
    return key;
  }

  async download(key) {
    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return res.Body;
  }

  async delete(key) {
    const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async exists(key) {
    const { HeadObjectCommand } = require("@aws-sdk/client-s3");
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(key, expiresInSeconds = 3600) {
    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn: expiresInSeconds });
  }
}

module.exports = S3StorageService;
