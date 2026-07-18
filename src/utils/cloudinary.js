import { compressImage } from "./images";

export const CLOUDINARY_CLOUD_NAME = "cgn7v0cd";
export const CLOUDINARY_UPLOAD_PRESET = "gw-one";

const MAX_RETRIES = 3;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uploadRequest(file, folder, resourceType, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", `gw-one/${folder}`);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`
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
          duration: payload.duration || 0,
          bytes: payload.bytes || file.size || 0,
          format: payload.format || "",
          originalName: file.name || "media",
          resourceType
        });
        return;
      }

      reject(
        new Error(
          payload?.error?.message ||
            `업로드에 실패했습니다. (${xhr.status || "network"})`
        )
      );
    };

    xhr.onerror = () =>
      reject(new Error("업로드 중 인터넷 연결이 끊겼습니다."));
    xhr.ontimeout = () =>
      reject(new Error("업로드 시간이 초과되었습니다."));
    xhr.timeout = resourceType === "video" ? 300000 : 180000;
    xhr.send(formData);
  });
}

async function uploadWithRetry({
  file,
  folder,
  resourceType,
  onProgress,
  retryCount = 0
}) {
  try {
    const uploadFile =
      resourceType === "image" ? await compressImage(file) : file;

    onProgress?.(8, "uploading");

    return await uploadRequest(
      uploadFile,
      folder,
      resourceType,
      (percent) =>
        onProgress?.(Math.max(8, percent), "uploading")
    );
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      onProgress?.(0, "retrying");
      await wait(1100 * (retryCount + 1));
      return uploadWithRetry({
        file,
        folder,
        resourceType,
        onProgress,
        retryCount: retryCount + 1
      });
    }

    throw error;
  }
}

export async function uploadPhotoToCloudinary(
  file,
  folder,
  onProgress
) {
  onProgress?.(3, "compressing");
  return uploadWithRetry({
    file,
    folder,
    resourceType: "image",
    onProgress
  });
}

export async function uploadVideoToCloudinary(
  file,
  folder,
  onProgress
) {
  // 모바일 브라우저에서는 선택한 동영상을 안정적으로 재인코딩하기 어렵습니다.
  // 업로드 후 Cloudinary의 자동 최적화 URL로 재생해 데이터 사용량을 줄입니다.
  onProgress?.(3, "preparing");
  return uploadWithRetry({
    file,
    folder,
    resourceType: "video",
    onProgress
  });
}

export function optimizedVideoUrl(url) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace(
    "/upload/",
    "/upload/q_auto:eco,f_auto,vc_auto,w_1280/"
  );
}


export function normalizeMediaUrl(value) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    return String(
      value.url ||
      value.secure_url ||
      value.downloadURL ||
      value.src ||
      ""
    ).trim();
  }
  return "";
}

export function existingPhotoItem(value, index = 0) {
  const url = normalizeMediaUrl(value);
  return {
    id: `existing-${index}-${url || "missing"}`,
    url,
    publicId: "",
    originalName: `기존 사진 ${index + 1}`,
    progress: 100,
    status: "done",
    error: "",
    resourceType: "image"
  };
}

export function existingVideoItem(value, index = 0) {
  const url = normalizeMediaUrl(value);
  return {
    id: `existing-video-${index}-${url || "missing"}`,
    url,
    publicId: "",
    originalName: `기존 동영상 ${index + 1}`,
    progress: 100,
    status: "done",
    error: "",
    resourceType: "video"
  };
}

export function mediaUrls(items = []) {
  return items
    .filter((item) => item?.status === "done" && normalizeMediaUrl(item))
    .map((item) => normalizeMediaUrl(item));
}

export const photoUrls = mediaUrls;

export function hasPendingPhotos(items = []) {
  return items.some(
    (item) =>
      item?.status === "uploading" ||
      item?.status === "retrying" ||
      item?.status === "compressing" ||
      item?.status === "preparing"
  );
}

export function hasFailedPhotos(items = []) {
  return items.some((item) => item?.status === "error");
}
