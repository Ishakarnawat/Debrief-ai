/**
 * cloudUploader.js
 * Client-side utility for streaming recorded video files directly to cloud storage
 * (AWS S3, Cloudinary, or Local Direct Stream) via presigned URLs.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Checks if the backend has cloud or direct streaming enabled
 */
export async function getStorageConfig(authHeaders = {}) {
  try {
    const res = await fetch(`${API_URL}/api/media/storage-config`, {
      headers: { ...authHeaders },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.config || null;
  } catch (e) {
    console.warn("Storage config lookup failed, using fallback:", e);
    return null;
  }
}

/**
 * Uploads a recorded video Blob directly using presigned URL credentials
 * with real-time percentage progress callback.
 */
export async function uploadDirectToCloud({
  blob,
  filename = "interview.mp4",
  contentType = "video/mp4",
  authHeaders = {},
  onProgress = () => {},
}) {
  try {
    // 1. Request presigned URL from backend
    const presignedRes = await fetch(`${API_URL}/api/media/presigned-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ filename, contentType }),
    });

    if (!presignedRes.ok) {
      throw new Error(`Failed to request presigned upload URL: ${presignedRes.statusText}`);
    }

    const presigned = await presignedRes.json();
    if (!presigned.uploadUrl) {
      throw new Error("No upload URL returned by backend.");
    }

    // Determine target URL (relative or absolute)
    const targetUrl = presigned.uploadUrl.startsWith("http")
      ? presigned.uploadUrl
      : `${API_URL}${presigned.uploadUrl}`;

    // 2. Perform direct binary upload with XMLHttpRequest for upload progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(presigned.method || "PUT", targetUrl);

      // Set headers if provided
      if (presigned.headers) {
        Object.entries(presigned.headers).forEach(([k, v]) => {
          xhr.setRequestHeader(k, v);
        });
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            success: true,
            provider: presigned.provider,
            mediaUrl: presigned.mediaUrl,
            fileKey: presigned.fileKey,
            directUpload: true,
          });
        } else {
          reject(new Error(`Direct cloud upload failed with HTTP ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during direct cloud upload."));
      };

      xhr.send(blob);
    });
  } catch (err) {
    console.warn("Direct cloud upload bypassed or failed, falling back to multipart:", err);
    return { directUpload: false, error: err.message };
  }
}
