import { useRef } from "react";
import { uploadPhotoToCloudinary } from "../utils/cloudinary";

const MAX_PHOTOS = 10;

function makePendingItem(file) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    url: URL.createObjectURL(file),
    originalName: file.name || "photo",
    progress: 0,
    status: "uploading",
    error: ""
  };
}

export default function PhotoField({
  title,
  folder,
  files,
  onChange,
  onNotice
}) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const updateItem = (id, patch) => {
    onChange((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    );
  };

  const uploadOne = async (item) => {
    try {
      const result = await uploadPhotoToCloudinary(
        item.file,
        folder,
        (progress, phase) => {
          updateItem(item.id, {
            progress,
            status: phase === "retrying" ? "retrying" : "uploading",
            error: ""
          });
        }
      );

      const localPreviewUrl = item.url;

      updateItem(item.id, {
        ...result,
        file: null,
        progress: 100,
        status: "done",
        error: ""
      });

      // 상태가 Cloudinary URL로 바뀌기 전에 blob URL을 먼저 해제하면
      // 일부 안드로이드 브라우저에서 깨진 이미지로 표시될 수 있습니다.
      if (localPreviewUrl?.startsWith("blob:")) {
        window.setTimeout(() => {
          URL.revokeObjectURL(localPreviewUrl);
        }, 1200);
      }
    } catch (error) {
      updateItem(item.id, {
        progress: 0,
        status: "error",
        error: error.message || "사진 업로드 실패"
      });
      onNotice?.(`${title} 사진 업로드 실패: ${error.message}`);
    }
  };

  const appendFiles = (selectedFiles) => {
    const incoming = Array.from(selectedFiles || []).filter((file) =>
      file.type.startsWith("image/")
    );

    if (!incoming.length) return;

    const remaining = Math.max(0, MAX_PHOTOS - files.length);
    const nextIncoming = incoming.slice(0, remaining);

    if (incoming.length > remaining) {
      onNotice?.(`${title} 사진은 최대 ${MAX_PHOTOS}장까지 넣을 수 있습니다.`);
    }

    const items = nextIncoming.map(makePendingItem);
    onChange((current) => [...current, ...items]);

    // 휴대폰에서 여러 장을 동시에 올리면 실패율이 높아질 수 있어
    // 한 장씩 순서대로 업로드합니다.
    void (async () => {
      for (const item of items) {
        await uploadOne(item);
      }
    })();
  };

  const removePhoto = (item) => {
    if (item.url?.startsWith("blob:")) {
      URL.revokeObjectURL(item.url);
    }

    onChange((current) =>
      current.filter((currentItem) => currentItem.id !== item.id)
    );
  };

  const retryPhoto = (item) => {
    if (!item.file) {
      onNotice?.("이 사진은 다시 선택해 주세요.");
      return;
    }

    updateItem(item.id, {
      progress: 0,
      status: "uploading",
      error: ""
    });
    uploadOne(item);
  };

  const clearAll = () => {
    files.forEach((item) => {
      if (item.url?.startsWith("blob:")) {
        URL.revokeObjectURL(item.url);
      }
    });
    onChange([]);
  };

  const doneCount = files.filter((item) => item.status === "done").length;
  const uploadingCount = files.filter(
    (item) => item.status === "uploading" || item.status === "retrying"
  ).length;
  const failedCount = files.filter((item) => item.status === "error").length;

  return (
    <div className="photo-field easy-photo-field">
      <div className="photo-field-head">
        <div>
          <strong>{title}</strong>
          <small>
            {files.length
              ? `완료 ${doneCount}장${
                  uploadingCount ? ` · 업로드 중 ${uploadingCount}장` : ""
                }${failedCount ? ` · 실패 ${failedCount}장` : ""}`
              : "사진이 없으면 건너뛰어도 됩니다."}
          </small>
        </div>

        {files.length > 0 && (
          <button
            type="button"
            className="photo-clear-button"
            onClick={clearAll}
          >
            전체 삭제
          </button>
        )}
      </div>

      <div className="photo-action-grid">
        <button
          type="button"
          className="photo-action-button camera"
          onClick={() => cameraRef.current?.click()}
        >
          <span>📷</span>
          <strong>카메라로 찍기</strong>
        </button>

        <button
          type="button"
          className="photo-action-button gallery"
          onClick={() => galleryRef.current?.click()}
        >
          <span>🖼️</span>
          <strong>앨범에서 선택</strong>
        </button>
      </div>

      <input
        ref={cameraRef}
        className="hidden-file-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => {
          appendFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <input
        ref={galleryRef}
        className="hidden-file-input"
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          appendFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {files.length > 0 && (
        <div className="photo-preview-grid cloud-photo-grid">
          {files.map((item, index) => (
            <div
              className={`photo-preview-card cloud-photo-card ${item.status}`}
              key={item.id}
            >
              <img
                src={item.url}
                alt={`${title} ${index + 1}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  const image = event.currentTarget;
                  const retryCount = Number(image.dataset.retryCount || 0);

                  if (
                    item.status === "done" &&
                    item.url &&
                    retryCount < 1
                  ) {
                    image.dataset.retryCount = "1";
                    const separator = item.url.includes("?") ? "&" : "?";
                    image.src = `${item.url}${separator}gw_retry=${Date.now()}`;
                    return;
                  }

                  image.classList.add("photo-image-load-error");
                }}
              />
              <span>{index + 1}</span>

              <button
                type="button"
                aria-label={`${index + 1}번째 사진 삭제`}
                onClick={() => removePhoto(item)}
              >
                ×
              </button>

              {item.status !== "done" && (
                <div className="photo-upload-overlay">
                  {item.status === "error" ? (
                    <>
                      <strong>업로드 실패</strong>
                      <small>{item.error || "다시 시도해 주세요."}</small>
                      <button
                        type="button"
                        className="photo-retry-button"
                        onClick={() => retryPhoto(item)}
                      >
                        다시 시도
                      </button>
                    </>
                  ) : (
                    <>
                      <strong>
                        {item.status === "retrying"
                          ? "재시도 중..."
                          : "사진 업로드 중..."}
                      </strong>
                      <div className="photo-progress-track">
                        <i style={{ width: `${item.progress || 0}%` }} />
                      </div>
                      <small>{item.progress || 0}%</small>
                    </>
                  )}
                </div>
              )}

              {item.status === "done" && (
                <div className="photo-upload-done">✓ 업로드 완료</div>
              )}

              {item.status === "done" && item.url && (
                <a
                  className="photo-open-original"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  원본 보기
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="photo-limit-guide">
        최대 {MAX_PHOTOS}장 · 자동 압축 후 한 장씩 안정적으로 업로드됩니다.
      </p>
    </div>
  );
}
