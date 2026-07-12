import { Field } from "./Common";
import {
  DEFAULT_STAMP_DATA_URL,
  formatBusinessNumber
} from "../utils/businessProfile";

export default function ProfileBox({
  profile,
  setProfile,
  stampFile,
  setStampFile,
  onSave,
  saving,
  forceOpen = false
}) {
  const stampPreview =
    stampFile?.previewUrl ||
    profile.stampDataUrl ||
    profile.stampUrl ||
    DEFAULT_STAMP_DATA_URL;

  const selectStamp = (file) => {
    if (!file) {
      setStampFile(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setStampFile({ file, previewUrl, name: file.name });
  };

  return (
    <details
      className="profile-box"
      defaultOpen={forceOpen || !profile.businessName}
    >
      <summary>업체정보 · {profile.businessName || "등록 필요"}</summary>

      <div className="profile-fields">
        <Field label="상호명" required>
          <input
            value={profile.businessName || ""}
            onChange={(event) =>
              setProfile({ ...profile, businessName: event.target.value })
            }
            placeholder="예: 주식회사 더블유솔루션"
          />
        </Field>

        <Field label="대표자명" required>
          <input
            value={profile.representativeName || ""}
            onChange={(event) =>
              setProfile({ ...profile, representativeName: event.target.value })
            }
            placeholder="예: 연규억, 조원형"
          />
        </Field>

        <Field label="사업자등록번호" required>
          <input
            inputMode="numeric"
            value={profile.businessNumber || ""}
            onChange={(event) =>
              setProfile({
                ...profile,
                businessNumber: formatBusinessNumber(event.target.value)
              })
            }
            placeholder="000-00-00000"
          />
        </Field>

        <Field label="업체 연락처">
          <input
            value={profile.contact || ""}
            onChange={(event) =>
              setProfile({ ...profile, contact: event.target.value })
            }
            placeholder="010-0000-0000"
          />
        </Field>

        <Field label="업체 이메일">
          <input
            type="email"
            value={profile.businessEmail || ""}
            onChange={(event) =>
              setProfile({ ...profile, businessEmail: event.target.value })
            }
            placeholder="선택 입력"
          />
        </Field>

        <Field label="사업장 주소">
          <input
            value={profile.businessAddress || ""}
            onChange={(event) =>
              setProfile({ ...profile, businessAddress: event.target.value })
            }
            placeholder="선택 입력"
          />
        </Field>

        <div className="stamp-field">
          <strong>직인 이미지</strong>
          <p className="stamp-help">
            Firebase Storage를 사용하지 않고 업체정보에 함께 저장됩니다.
          </p>

          {stampPreview && (
            <div className="stamp-preview-box">
              <img src={stampPreview} alt="등록 직인" />
            </div>
          )}

          <label className="photo-upload">
            직인 변경
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) =>
                selectStamp(event.target.files?.[0] || null)
              }
            />
          </label>

          {stampFile && <small>{stampFile.name} 선택됨</small>}
        </div>

        <button
          type="button"
          className="primary"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "저장 중..." : "업체정보 저장"}
        </button>
      </div>
    </details>
  );
}
