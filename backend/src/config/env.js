require("dotenv").config();

function required(name) {
  const v = process.env[name];
  if (!v) console.warn(`[config] WARNING: env var ${name} is not set`);
  return v;
}

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: required("MONGODB_URI"),
  adminEmail: required("ADMIN_EMAIL"),
  adminPasswordHash: required("ADMIN_PASSWORD_HASH"),
  jwtSecret: required("JWT_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  storageProvider: process.env.STORAGE_PROVIDER || "local",
  storage: {
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION || "auto",
    bucket: process.env.STORAGE_BUCKET,
    accessKey: process.env.STORAGE_ACCESS_KEY,
    secretKey: process.env.STORAGE_SECRET_KEY,
    publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL,
  },
  pairingCodeTtlSeconds: parseInt(process.env.PAIRING_CODE_TTL_SECONDS || "300", 10),
  deviceTokenExpiresIn: process.env.DEVICE_TOKEN_EXPIRES_IN || "365d",
};
