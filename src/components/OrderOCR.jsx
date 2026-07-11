import { useEffect, useState } from "react";
import { analyzeOrderImage } from "../utils/ocr";

export default function OrderOCR({ onResult, onNotice }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (nextFile) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile || null);
    setPreview(nextFile ? URL.createObjectURL(nextFile) : "");
    setRawText("");
    setProgress(0);
  };

  const handleAnalyze = async () => {
    if (!file) {
      onNotice("먼저 문자나 카카오톡 캡처 이미지를 선택해 주세요.");
      return;
    }

    setRunning(true);
    setProgress(0);
    onNotice("");

    try {
      const result = await analyzeOrderImage(file, setProgress);
      setRawText(result.text);
      onResult(result);

      if (result.phone || result.address) {
        const found = [
          result.phone ? `전화번호 ${result.phone}` : "",
          result.address ? `주소 ${result.address}` : ""
        ]
          .filter(Boolean)
          .join(" / ");

        onNotice(`오더 분석 완료: ${found}`);
      } else {
        onNotice(
          "글자는 읽었지만 전화번호나 주소를 자동으로 찾지 못했습니다. 인식된 글자를 확인해 주세요."
        );
      }
    } catch (error) {
      onNotice(`오더 이미지를 분석하지 못했습니다: ${error.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="form-section order-analyzer-section">
      <h3>오더 이미지 자동분석</h3>
      <p className="section-description">
        문자나 카카오톡 캡처를 선택하면 전화번호와 주소를 자동으로 입력합니다.
      </p>

      <div className="order-analyzer">
        <label className="order-image-picker">
          <span>📷 오더 이미지 선택</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => handleFile(event.target.files?.[0] || null)}
          />
        </label>

        {preview && (
          <img className="order-preview" src={preview} alt="선택한 오더 캡처" />
        )}

        <button
          type="button"
          className="primary order-analyze-button"
          onClick={handleAnalyze}
          disabled={running || !file}
        >
          {running ? `분석 중... ${progress}%` : "🔎 전화번호·주소 자동입력"}
        </button>

        {running && (
          <div className="ocr-progress">
            <span style={{ width: `${progress}%` }} />
          </div>
        )}

        {rawText && (
          <details className="ocr-result">
            <summary>인식된 글자 확인</summary>
            <pre>{rawText}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
