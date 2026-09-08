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
 * with real-time percentage progress callback and provider telemetry.
 */
export async function uploadDirectToCloud({
  blob,
  filename = "interview.mp4",
  contentType = "video/mp4",
  authHeaders = {},
  onProgress = () => {},
}) {
  try {
    // 1. Request presigned URL or token from backend
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

    // 2. Perform direct binary or multipart upload with XMLHttpRequest for upload progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const method = presigned.method || "PUT";
      xhr.open(method, targetUrl);

      let payloadToSend = blob;

      // Handle Cloudinary signed multipart upload
      if (presigned.provider === "cloudinary" && presigned.params) {
        const formData = new FormData();
        Object.entries(presigned.params).forEach(([k, v]) => {
          formData.append(k, v);
        });
        formData.append("file", blob, filename);
        payloadToSend = formData;
      } else {
        // Handle raw binary streams (AWS S3 and Local Direct Streaming)
        if (presigned.headers) {
          Object.entries(presigned.headers).forEach(([k, v]) => {
            xhr.setRequestHeader(k, v);
          });
        }
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
          onProgress(percent, presigned.provider);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100, presigned.provider);
          let responseJson = null;
          try {
            responseJson = JSON.parse(xhr.responseText);
          } catch (e) {
            // S3 responses are often XML or empty 200/204
          }

          let resolvedMediaUrl = presigned.mediaUrl;
          let resolvedFileKey = presigned.fileKey;

          if (presigned.provider === "cloudinary" && responseJson?.secure_url) {
            resolvedMediaUrl = responseJson.secure_url;
            resolvedFileKey = responseJson.public_id || presigned.fileKey;
          } else if (presigned.provider === "local_streaming" && responseJson?.mediaUrl) {
            resolvedMediaUrl = responseJson.mediaUrl;
            resolvedFileKey = responseJson.filename || presigned.fileKey;
          }

          resolve({
            success: true,
            provider: presigned.provider,
            mediaUrl: resolvedMediaUrl,
            fileKey: resolvedFileKey,
            directUpload: true,
          });
        } else {
          reject(new Error(`Direct cloud upload failed with HTTP ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during direct cloud upload."));
      };

      xhr.send(payloadToSend);
    });
  } catch (err) {
    console.warn("Direct cloud upload bypassed or failed, falling back to standard multipart:", err);
    return { directUpload: false, error: err.message };
  }
}
