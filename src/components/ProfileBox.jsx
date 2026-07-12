import { Field } from "./Common";

export default function ProfileBox({
  profile,
  setProfile,
  stampFile,
  setStampFile,
  onSave,
  saving,
  forceOpen = false
}) {
  return (
    <details
      className="profile-box"
      defaultOpen={forceOpen || !profile.businessName}
    >
      <summary>업체정보 · {profile.businessName || "등록 필요"}</summary>

      <div className="profile-fields">
        <Field label="상호명" required>
          <input
            value={profile.businessName}
            onChange={(event) =>
              setProfile({ ...profile, businessName: event.target.value })
            }
            placeholder="예: 태경종합설비"
          />
        </Field>

        <Field label="대표자명" required>
          <input
            value={profile.representativeName}
            onChange={(event) =>
              setProfile({ ...profile, representativeName: event.target.value })
            }
            placeholder="대표자명"
          />
        </Field>

        <Field label="업체 연락처">
          <input
            value={profile.contact}
            onChange={(event) =>
              setProfile({ ...profile, contact: event.target.value })
            }
            placeholder="010-0000-0000"
          />
        </Field>

        <div className="stamp-field">
          <strong>직인 이미지</strong>
          {profile.stampUrl && <img src={profile.stampUrl} alt="등록 직인" />}

          <label className="photo-upload">
            직인 선택
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setStampFile(event.target.files?.[0] || null)
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
