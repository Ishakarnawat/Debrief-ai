/**
 * cloudStorage.js
 * High-performance direct-to-cloud storage manager.
 * Supports AWS S3 presigned PUT streaming (native AWS SigV4 via Node crypto),
 * Cloudinary signed uploads, and local direct streaming fallback.
 */

const crypto = require("crypto");
const path = require("path");

// In-memory token store for local direct uploads
const directUploadTokens = new Map();

/**
 * Returns active cloud storage configuration
 */
function getStorageConfig() {
  const hasS3 = Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );

  const hasCloudinary = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  let provider = "local_streaming";
  if (hasS3) provider = "aws_s3";
  else if (hasCloudinary) provider = "cloudinary";

  return {
    provider,
    directUploadEnabled: true,
    bucket: process.env.AWS_S3_BUCKET || null,
    region: process.env.AWS_REGION || "us-east-1",
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
  };
}

/**
 * Generates an AWS S3 Presigned PUT URL using native AWS Signature Version 4
 */
function generateS3PresignedPutUrl({ filename, contentType, expiresIn = 900 }) {
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || "us-east-1";

  const ext = path.extname(filename) || ".mp4";
  const fileKey = `recordings/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const endpoint = `https://${host}/${fileKey}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.substring(0, 8);

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;

  // Query parameters in alphabetical order
  const queryParams = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKey}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "content-type;host",
  };

  const canonicalQueryString = Object.keys(queryParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
    .join("&");

  const canonicalHeaders = `content-type:${contentType.toLowerCase()}\nhost:${host}\n`;
  const signedHeaders = "content-type;host";
  const payloadHash = "UNSIGNED-PAYLOAD";

  const canonicalRequest = [
    "PUT",
    `/${fileKey}`,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  // HMAC-SHA256 signing key derivation
  const getSignatureKey = (key, date, reg, svc) => {
    const kDate = crypto.createHmac("sha256", `AWS4${key}`).update(date).digest();
    const kRegion = crypto.createHmac("sha256", kDate).update(reg).digest();
    const kService = crypto.createHmac("sha256", kRegion).update(svc).digest();
    const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
    return kSigning;
  };

  const signingKey = getSignatureKey(secretKey, dateStamp, region, "s3");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  const presignedUrl = `${endpoint}?${canonicalQueryString}&X-Amz-Signature=${signature}`;

  return {
    provider: "aws_s3",
    uploadUrl: presignedUrl,
    fileKey,
    mediaUrl: endpoint,
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    expiresIn,
  };
}

/**
 * Generates a signed Cloudinary video upload URL & parameter set
 */
function generateCloudinaryUploadSignature() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "debrief_interviews";

  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(paramsToSign + apiSecret).digest("hex");

  return {
    provider: "cloudinary",
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    method: "POST",
    params: {
      api_key: apiKey,
      timestamp,
      signature,
      folder,
    },
  };
}

/**
 * Generates a local direct upload token and streaming URL
 */
function generateLocalDirectUpload({ filename, contentType }) {
  const ext = path.extname(filename) || ".mp4";
  const uniqueName = `direct_${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`;
  const uploadToken = "up_" + crypto.randomBytes(16).toString("hex");

  directUploadTokens.set(uploadToken, {
    filename: uniqueName,
    contentType,
    createdAt: Date.now(),
  });

  // Expire after 30 minutes
  setTimeout(() => directUploadTokens.delete(uploadToken), 30 * 60 * 1000).unref();

  return {
    provider: "local_streaming",
    uploadUrl: `/api/media/direct-upload/${uploadToken}`,
    fileKey: uniqueName,
    mediaUrl: `/api/media/${uniqueName}`,
    method: "PUT",
    headers: {
      "Content-Type": contentType || "video/mp4",
    },
  };
}

/**
 * Master dispatcher to generate direct presigned upload credentials
 */
function generatePresignedUpload({ filename = "interview.mp4", contentType = "video/mp4" }) {
  const config = getStorageConfig();

  if (config.provider === "aws_s3") {
    return generateS3PresignedPutUrl({ filename, contentType });
  }

  if (config.provider === "cloudinary") {
    return generateCloudinaryUploadSignature();
  }

  return generateLocalDirectUpload({ filename, contentType });
}

module.exports = {
  getStorageConfig,
  generatePresignedUpload,
  directUploadTokens,
};
