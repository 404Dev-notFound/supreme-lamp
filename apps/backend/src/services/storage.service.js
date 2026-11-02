const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Production File Storage Service
 * Implements abstracted secure storage pipeline with magic-byte validation,
 * randomized safe identifiers, strict path traversal defense, and access-controlled streaming.
 */

// Storage directory outside src/, located in apps/backend/uploads
const BASE_STORAGE_DIR = path.resolve(__dirname, "../../uploads");

// Allowed file types with size limits and MIME mappings
const ALLOWED_PROFILES = {
  resume: {
    maxBytes: 8 * 1024 * 1024, // 8MB
    allowedExtensions: [".pdf"],
    allowedMimes: ["application/pdf"],
    subDir: "resumes",
  },
  avatar: {
    maxBytes: 4 * 1024 * 1024, // 4MB
    allowedExtensions: [".png", ".jpg", ".jpeg", ".webp"],
    allowedMimes: ["image/png", "image/jpeg", "image/webp"],
    subDir: "avatars",
  },
};

/**
 * Validates magic numbers (file headers) from buffer to prevent extension-spoofing
 */
function validateMagicBytes(buffer, category) {
  if (!buffer || buffer.length < 4) return false;

  // PDF Magic Bytes: %PDF- (0x25 0x50 0x44 0x46)
  if (category === "resume") {
    return (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    );
  }

  // Image Magic Bytes
  if (category === "avatar") {
    // PNG: 89 50 4E 47
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return true;
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return true;
    }
    // WebP: RIFF ... WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Ensures storage directories exist
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Saves a file buffer securely.
 * Returns: { storageKey, fileName, fileSize, mimeType, relativePath }
 */
async function storeFile({
  buffer,
  originalFilename,
  mimeType,
  category = "resume",
}) {
  const profile = ALLOWED_PROFILES[category];
  if (!profile) {
    throw new Error(`Invalid storage category: ${category}`);
  }

  if (!buffer || Buffer.byteLength(buffer) === 0) {
    throw new Error("File payload is empty.");
  }

  const fileSize = Buffer.byteLength(buffer);
  if (fileSize > profile.maxBytes) {
    throw new Error(
      `File exceeds maximum permitted size of ${Math.round(profile.maxBytes / (1024 * 1024))}MB.`,
    );
  }

  // Validate declared MIME type
  const cleanMime = String(mimeType || "").toLowerCase().trim();
  if (!profile.allowedMimes.includes(cleanMime)) {
    throw new Error(`File MIME type '${cleanMime}' is not permitted.`);
  }

  // Validate extension
  const ext = path.extname(originalFilename || "").toLowerCase();
  if (!profile.allowedExtensions.includes(ext)) {
    throw new Error(`File extension '${ext}' is not permitted.`);
  }

  // Validate magic bytes
  const isSignatureValid = validateMagicBytes(buffer, category);
  if (!isSignatureValid) {
    throw new Error("File content signature does not match declared file type.");
  }

  // Generate safe cryptographically random filename
  const safeRandomId = crypto.randomUUID();
  const safeStorageKey = `${category}/${safeRandomId}${ext}`;

  const targetCategoryDir = path.join(BASE_STORAGE_DIR, profile.subDir);
  ensureDir(targetCategoryDir);

  const absoluteDiskPath = path.join(targetCategoryDir, `${safeRandomId}${ext}`);

  // Prevent path traversal
  const normalizedPath = path.normalize(absoluteDiskPath);
  if (!normalizedPath.startsWith(path.normalize(BASE_STORAGE_DIR))) {
    throw new Error("Security violation: path traversal detected.");
  }

  // Write file to disk
  await fs.promises.writeFile(normalizedPath, buffer);

  // Strip dangerous characters from original filename for metadata display
  const sanitizedOriginalName = path
    .basename(originalFilename || "upload")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 150);

  return {
    storageKey: safeStorageKey,
    fileName: sanitizedOriginalName,
    fileSize,
    mimeType: cleanMime,
    diskPath: normalizedPath,
  };
}

/**
 * Resolves absolute disk path from storageKey with path-traversal guard
 */
function resolveStoragePath(storageKey) {
  if (!storageKey || typeof storageKey !== "string") {
    throw new Error("Invalid storage key.");
  }

  // Disallow any path traversal characters
  if (storageKey.includes("..") || path.isAbsolute(storageKey)) {
    throw new Error("Security violation: invalid storage key sequence.");
  }

  const [category, filename] = storageKey.split("/");
  const profile = ALLOWED_PROFILES[category];
  if (!profile || !filename) {
    throw new Error("Storage key does not match recognized namespace.");
  }

  const resolved = path.join(BASE_STORAGE_DIR, profile.subDir, filename);
  const normalized = path.normalize(resolved);

  if (!normalized.startsWith(path.normalize(BASE_STORAGE_DIR))) {
    throw new Error("Security violation: access outside storage root.");
  }

  return normalized;
}

/**
 * Checks if file exists
 */
function fileExists(storageKey) {
  try {
    const filePath = resolveStoragePath(storageKey);
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Returns read stream for controlled streaming
 */
function getReadStream(storageKey) {
  const filePath = resolveStoragePath(storageKey);
  if (!fs.existsSync(filePath)) {
    throw new Error("File not found on storage.");
  }
  return fs.createReadStream(filePath);
}

/**
 * Deletes file from storage
 */
async function deleteFile(storageKey) {
  try {
    const filePath = resolveStoragePath(storageKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.warn(`[StorageService] Failed to delete file for key ${storageKey}:`, err.message);
    return false;
  }
}

module.exports = {
  storeFile,
  getReadStream,
  deleteFile,
  fileExists,
  resolveStoragePath,
  validateMagicBytes,
};
