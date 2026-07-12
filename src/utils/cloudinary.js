import { compressImage } from "./images";

export const CLOUDINARY_CLOUD_NAME = "cgn7v0cd";
export const CLOUDINARY_UPLOAD_PRESET = "gw-one";

const MAX_RETRIES = 2;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uploadRequest(file, folder, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", `gw-one/${folder}`);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
    );

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      let payload = null;

      try {
        payload = JSON.parse(xhr.responseText || "{}");
      } catch {
        payload = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload?.secure_url) {
        resolve({
          url: payload.secure_url,
          publicId: payload.public_id || "",
          width: payload.width || 0,
          height: payload.height || 0,
          bytes: payload.bytes || file.size || 0,
          format: payload.format || "",
          originalName: file.name || "photo"
        });
        return;
      }

      reject(
        new Error(
          payload?.error?.message ||
            `사진 업로드에 실패했습니다. (${xhr.status || "network"})`
        )
      );
    };

    xhr.onerror = () => reject(new Error("사진 업로드 중 인터넷 연결이 끊겼습니다."));
    xhr.ontimeout = () => reject(new Error("사진 업로드 시간이 초과되었습니다."));
    xhr.timeout = 120000;
    xhr.send(formData);
  });
}

export async function uploadPhotoToCloudinary(
  file,
  folder,
  onProgress,
  retryCount = 0
) {
  try {
    onProgress?.(3, "compressing");
    const compressed = await compressImage(file);
    onProgress?.(8, "uploading");
    return await uploadRequest(compressed, folder, (percent) =>
      onProgress?.(Math.max(8, percent), "uploading")
    );
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      onProgress?.(0, "retrying");
      await wait(900 * (retryCount + 1));
      return uploadPhotoToCloudinary(
        file,
        folder,
        onProgress,
        retryCount + 1
      );
    }

    throw error;
  }
}

export function existingPhotoItem(url, index = 0) {
  return {
    id: `existing-${index}-${url}`,
    url,
    publicId: "",
    originalName: `기존 사진 ${index + 1}`,
    progress: 100,
    status: "done",
    error: ""
  };
}

export function photoUrls(items = []) {
  return items
    .filter((item) => item?.status === "done" && item?.url)
    .map((item) => item.url);
}

export function hasPendingPhotos(items = []) {
  return items.some(
    (item) => item?.status === "uploading" || item?.status === "retrying"
  );
}

export function hasFailedPhotos(items = []) {
  return items.some((item) => item?.status === "error");
}
