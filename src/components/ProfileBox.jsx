import { useState } from "react";
import { Field } from "./Common";
import {
  DEFAULT_STAMP_DATA_URL,
  formatBusinessNumber
} from "../utils/businessProfile";

const EMPTY_DOCUMENT_BUSINESS = {
  businessName: "",
  representativeName: "",
  businessNumber: "",
  contact: "",
  businessEmail: "",
  businessAddress: ""
};

export default function ProfileBox({
  profile,
  setProfile,
  stampFile,
  setStampFile,
  onSave,
  saving,
  forceOpen = false
}) {
  const [showBusinessAdd, setShowBusinessAdd] = useState(false);
  const [businessDraft, setBusinessDraft] = useState(
    EMPTY_DOCUMENT_BUSINESS
  );

  const stampPreview =
    stampFile?.previewUrl ||
    profile.stampDataUrl ||
    profile.stampUrl ||
    DEFAULT_STAMP_DATA_URL;

  const documentBusinesses = Array.isArray(profile.documentBusinesses)
    ? profile.documentBusinesses
    : [];

  const selectStamp = (file) => {
    if (!file) {
      setStampFile(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setStampFile({ file, previewUrl, name: file.name });
  };

  const addDocumentBusiness = () => {
    if (
      !businessDraft.businessName.trim() ||
      !businessDraft.representativeName.trim() ||
      businessDraft.businessNumber.replace(/\D/g, "").length !== 10
    ) {
      window.alert("상호명, 대표자명, 사업자등록번호 10자리를 확인해 주세요.");
      return;
    }

    const newBusiness = {
      id: `business-${Date.now()}`,
      ...businessDraft,
      businessName: businessDraft.businessName.trim(),
      representativeName: businessDraft.representativeName.trim(),
      stampDataUrl: ""
    };

    setProfile({
      ...profile,
      documentBusinesses: [...documentBusinesses, newBusiness]
    });
    setBusinessDraft(EMPTY_DOCUMENT_BUSINESS);
    setShowBusinessAdd(false);
  };

  const removeDocumentBusiness = (id) => {
    if (!window.confirm("이 문서용 사업자를 삭제할까요?")) return;

    setProfile({
      ...profile,
      documentBusinesses: documentBusinesses.filter(
        (business) => business.id !== id
      )
    });
  };

  return (
    <details
      className="profile-box"
      defaultOpen={forceOpen || !profile.businessName}
    >
      <summary>업체정보 · {profile.businessName || "등록 필요"}</summary>

      <div className="profile-fields">
        <div className="business-section-label">
          <strong>내 사업자 정보</strong>
          <span>내 수입과 기본 문서에 사용됩니다.</span>
        </div>

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

        <div className="document-business-manager">
          <div className="business-section-label">
            <strong>상호 관리</strong>
            <span>
              필요한 상호를 계속 추가할 수 있습니다. 작업 작성 시 선택하면
              사업자번호·대표자·직인이 자동으로 적용됩니다.
            </span>
          </div>

          {documentBusinesses.length > 0 ? (
            <div className="saved-business-list">
              {documentBusinesses.map((business) => (
                <article key={business.id}>
                  <div>
                    <strong>{business.businessName}</strong>
                    <span>
                      대표 {business.representativeName || "-"} ·{" "}
                      {business.businessNumber || "사업자번호 미입력"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocumentBusiness(business.id)}
                  >
                    삭제
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-business-guide">
              등록된 다른 사업자가 없습니다.
            </p>
          )}

          <button
            type="button"
            className="secondary business-add-toggle"
            onClick={() => setShowBusinessAdd((current) => !current)}
          >
            {showBusinessAdd ? "추가 취소" : "+ 상호 추가"}
          </button>

          {showBusinessAdd && (
            <div className="business-add-form">
              <Field label="상호명" required>
                <input
                  value={businessDraft.businessName}
                  onChange={(event) =>
                    setBusinessDraft({
                      ...businessDraft,
                      businessName: event.target.value
                    })
                  }
                  placeholder="다른 사업자 상호"
                />
              </Field>

              <Field label="대표자명" required>
                <input
                  value={businessDraft.representativeName}
                  onChange={(event) =>
                    setBusinessDraft({
                      ...businessDraft,
                      representativeName: event.target.value
                    })
                  }
                  placeholder="대표자명"
                />
              </Field>

              <Field label="사업자등록번호" required>
                <input
                  inputMode="numeric"
                  value={businessDraft.businessNumber}
                  onChange={(event) =>
                    setBusinessDraft({
                      ...businessDraft,
                      businessNumber: formatBusinessNumber(event.target.value)
                    })
                  }
                  placeholder="000-00-00000"
                />
              </Field>

              <Field label="연락처">
                <input
                  value={businessDraft.contact}
                  onChange={(event) =>
                    setBusinessDraft({
                      ...businessDraft,
                      contact: event.target.value
                    })
                  }
                />
              </Field>

              <Field label="이메일">
                <input
                  type="email"
                  value={businessDraft.businessEmail}
                  onChange={(event) =>
                    setBusinessDraft({
                      ...businessDraft,
                      businessEmail: event.target.value
                    })
                  }
                />
              </Field>

              <Field label="주소">
                <input
                  value={businessDraft.businessAddress}
                  onChange={(event) =>
                    setBusinessDraft({
                      ...businessDraft,
                      businessAddress: event.target.value
                    })
                  }
                />
              </Field>

              <button
                type="button"
                className="primary"
                onClick={addDocumentBusiness}
              >
                사업자 목록에 추가
              </button>
            </div>
          )}
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
