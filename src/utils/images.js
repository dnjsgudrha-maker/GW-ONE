const MAX_LONG_SIDE = 1600;
const JPEG_QUALITY = 0.82;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("사진을 불러오지 못했습니다."));
    };

    image.src = url;
  });
}

export async function compressImage(file) {
  if (!file?.type?.startsWith("image/")) return file;
  if (file.type === "image/gif") return file;

  const image = await loadImage(file);
  const longSide = Math.max(image.width, image.height);

  if (longSide <= MAX_LONG_SIDE && file.size <= 1_500_000) {
    return file;
  }

  const scale = Math.min(1, MAX_LONG_SIDE / longSide);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );

  if (!blob) return file;

  const baseName = String(file.name || "photo")
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w가-힣-]/g, "_");

  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now()
  });
}

export async function compressImages(files, onProgress) {
  const results = [];

  for (let index = 0; index < files.length; index += 1) {
    const compressed = await compressImage(files[index]);
    results.push(compressed);
    onProgress?.(index + 1, files.length);
  }

  return results;
}
