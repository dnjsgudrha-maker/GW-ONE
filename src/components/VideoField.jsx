import { useRef } from "react";
import {
  optimizedVideoUrl,
  uploadVideoToCloudinary
} from "../utils/cloudinary";

const MAX_VIDEOS = 2;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function makePendingItem(file) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    url: URL.createObjectURL(file),
    originalName: file.name || "video",
    progress: 0,
    status: "uploading",
    error: "",
    resourceType: "video"
  };
}

export default function VideoField({
  title = "현장 동영상",
  folder = "videos",
  files,
  onChange,
  onNotice
}) {
  const inputRef = useRef(null);

  const updateItem = (id, patch) => {
    onChange((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    );
  };

  const uploadOne = async (item) => {
    try {
      const result = await uploadVideoToCloudinary(
        item.file,
        folder,
        (progress, phase) => {
          updateItem(item.id, {
            progress,
            status: phase,
            error: ""
          });
        }
      );

      if (item.url?.startsWith("blob:")) {
        URL.revokeObjectURL(item.url);
      }

      updateItem(item.id, {
        ...result,
        file: null,
        progress: 100,
        status: "done",
        error: ""
      });
    } catch (error) {
      updateItem(item.id, {
        progress: 0,
        status: "error",
        error: error.message || "동영상 업로드 실패"
      });
      onNotice?.(`${title} 업로드 실패: ${error.message}`);
    }
  };

  const appendFiles = (selectedFiles) => {
    const incoming = Array.from(selectedFiles || []).filter((file) =>
      file.type.startsWith("video/")
    );

    if (!incoming.length) return;

    const oversized = incoming.find(
      (file) => file.size > MAX_VIDEO_BYTES
    );

    if (oversized) {
      onNotice?.(
        "동영상은 한 파일당 100MB 이하로 선택해 주세요. 짧게 촬영하면 업로드가 더 안정적입니다."
      );
      return;
    }

    const remaining = Math.max(0, MAX_VIDEOS - files.length);
    const nextIncoming = incoming.slice(0, remaining);

    if (incoming.length > remaining) {
      onNotice?.(`동영상은 최대 ${MAX_VIDEOS}개까지 넣을 수 있습니다.`);
    }

    const items = nextIncoming.map(makePendingItem);
    onChange((current) => [...current, ...items]);

    void (async () => {
      for (const item of items) {
        await uploadOne(item);
      }
    })();
  };

  const removeVideo = (item) => {
    if (item.url?.startsWith("blob:")) {
      URL.revokeObjectURL(item.url);
    }
    onChange((current) =>
      current.filter((value) => value.id !== item.id)
    );
  };

  const retryVideo = (item) => {
    if (!item.file) {
      onNotice?.("이 동영상은 다시 선택해 주세요.");
      return;
    }

    updateItem(item.id, {
      progress: 0,
      status: "uploading",
      error: ""
    });
    uploadOne(item);
  };

  return (
    <div className="video-field">
      <div className="photo-field-head">
        <div>
          <strong>{title}</strong>
          <small>
            최대 {MAX_VIDEOS}개 · 파일당 100MB 이하 권장
          </small>
        </div>
      </div>

      <button
        type="button"
        className="photo-action-button video"
        onClick={() => inputRef.current?.click()}
      >
        <span>🎥</span>
        <strong>동영상 선택</strong>
      </button>

      <input
        ref={inputRef}
        className="hidden-file-input"
        type="file"
        accept="video/*"
        multiple
        onChange={(event) => {
          appendFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {files.length > 0 && (
        <div className="video-preview-list">
          {files.map((item, index) => (
            <article className={`video-preview-card ${item.status}`} key={item.id}>
              <video
                controls
                preload="metadata"
                src={
                  item.status === "done"
                    ? optimizedVideoUrl(item.url)
                    : item.url
                }
              />
              <div>
                <strong>동영상 {index + 1}</strong>
                <small>{item.originalName}</small>

                {item.status === "done" ? (
                  <span className="video-done">✓ 업로드 완료</span>
                ) : item.status === "error" ? (
                  <>
                    <span className="video-error">{item.error}</span>
                    <button
                      type="button"
                      className="photo-retry-button"
                      onClick={() => retryVideo(item)}
                    >
                      다시 시도
                    </button>
                  </>
                ) : (
                  <>
                    <div className="photo-progress-track">
                      <i style={{ width: `${item.progress || 0}%` }} />
                    </div>
                    <span>
                      {item.status === "retrying"
                        ? "재시도 중"
                        : "업로드 중"}{" "}
                      {item.progress || 0}%
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                className="video-remove"
                onClick={() => removeVideo(item)}
              >
                삭제
              </button>
            </article>
          ))}
        </div>
      )}

      <p className="photo-limit-guide">
        동영상은 원본 업로드 후 Cloudinary가 재생 시 자동으로 화질과 용량을 최적화합니다.
      </p>
    </div>
  );
}
