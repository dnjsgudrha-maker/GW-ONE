import { useEffect, useMemo, useRef } from "react";

const MAX_PHOTOS = 10;

export default function PhotoField({
  title,
  files,
  onChange,
  onNotice
}) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file)
      })),
    [files]
  );

  useEffect(
    () => () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [previews]
  );

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

    onChange([...files, ...nextIncoming]);
  };

  const removePhoto = (index) => {
    onChange(files.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="photo-field easy-photo-field">
      <div className="photo-field-head">
        <div>
          <strong>{title}</strong>
          <small>
            {files.length
              ? `${files.length}장 선택됨`
              : "사진이 없으면 건너뛰어도 됩니다."}
          </small>
        </div>

        {files.length > 0 && (
          <button
            type="button"
            className="photo-clear-button"
            onClick={() => onChange([])}
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

      {previews.length > 0 && (
        <div className="photo-preview-grid">
          {previews.map((preview, index) => (
            <div className="photo-preview-card" key={`${preview.file.name}-${index}`}>
              <img src={preview.url} alt={`${title} ${index + 1}`} />
              <span>{index + 1}</span>
              <button
                type="button"
                aria-label={`${index + 1}번째 사진 삭제`}
                onClick={() => removePhoto(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="photo-limit-guide">
        최대 {MAX_PHOTOS}장 · 사진은 저장할 때 자동으로 용량을 줄입니다.
      </p>
    </div>
  );
}
