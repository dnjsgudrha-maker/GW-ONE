import { useEffect, useState } from "react";
import { EQUIPMENT, JOB_TYPES } from "../constants";
import { Field } from "./Common";
import OrderOCR from "./OrderOCR";
import PaymentBox from "./PaymentBox";
import PhotoField from "./PhotoField";
import VideoField from "./VideoField";
import ProfileBox from "./ProfileBox";
import LeakOpinionEngine from "./LeakOpinionEngine";
import WorkTemplateEngine from "./WorkTemplateEngine";
import { formatWon, normalizePhone } from "../utils/formatters";
import { getDocumentBusinesses } from "../utils/businesses";

function StepButton({ number, label, active, done, onClick }) {
  return (
    <button
      type="button"
      className={[
        "easy-step-button",
        active ? "active" : "",
        done ? "done" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      <span>{done ? "✓" : number}</span>
      <strong>{label}</strong>
    </button>
  );
}

export default function JobForm({
  profile,
  allProfiles,
  setProfile,
  stampFile,
  setStampFile,
  onProfileSave,
  profileSaving,
  form,
  setForm,
  beforePhotos,
  setBeforePhotos,
  duringPhotos,
  setDuringPhotos,
  afterPhotos,
  setAfterPhotos,
  videos,
  setVideos,
  onSave,
  saving,
  onBack,
  onNotice,
  chargeAmount,
  materialCost,
  commissionBaseAmount,
  commissionAmount,
  netAmount,
  currentRole,
  customerHistory,
  leakData,
  setLeakData,
  editingJob,
  onCancelEdit
}) {
  const [easyMode, setEasyMode] = useState(
    () => localStorage.getItem("gw-one-easy-mode") !== "off"
  );
  const [step, setStep] = useState(1);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [saveError, setSaveError] = useState("");
  const businessOptions = getDocumentBusinesses(profile, allProfiles);
  const selectedBusiness =
    businessOptions.find(
      (business) => business.id === (form.issuerBusinessId || "own")
    ) ||
    form.issuerBusinessSnapshot ||
    businessOptions[0];

  const canSelectBusiness = currentRole === "최고관리자";

  useEffect(() => {
    localStorage.setItem("gw-one-easy-mode", easyMode ? "on" : "off");
  }, [easyMode]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const toggleEquipment = (item) => {
    const selected = form.equipment.includes(item);

    setForm({
      ...form,
      equipment: selected
        ? form.equipment.filter((value) => value !== item)
        : [...form.equipment, item]
    });
  };

  const goNext = () => {
    if (step === 1 && !form.address.trim()) {
      onNotice("현장 주소를 입력해 주세요.");
      return;
    }

    if (step === 2 && !form.workContent.trim()) {
      onNotice("작업내용을 입력하거나 작업 템플릿을 선택해 주세요.");
      return;
    }

    onNotice("");
    setSaveConfirmOpen(false);
    setStep((current) => Math.min(current + 1, 3));
  };

  const goPrevious = () => {
    onNotice("");
    setStep((current) => Math.max(current - 1, 1));
  };

  const showStep = (targetStep) => !easyMode || step === targetStep;

  const paymentTotal = Object.values(form.paymentBreakdown || {}).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  );

  const requestSave = () => {
    if (!form.address.trim()) {
      onNotice("현장 주소를 입력해 주세요.");
      setStep(1);
      return;
    }

    if (!form.workContent.trim()) {
      onNotice("작업내용을 입력해 주세요.");
      setStep(2);
      return;
    }

    if (chargeAmount > 0 && paymentTotal !== chargeAmount) {
      onNotice("청구금액과 받은 금액 합계를 같게 맞춰 주세요.");
      setStep(3);
      return;
    }

    onNotice("");
    setSaveError("");
    setSaveConfirmOpen(true);
  };

  const confirmSave = async () => {
    setSaveError("");
    const saved = await onSave();

    if (saved) {
      setSaveConfirmOpen(false);
      return;
    }

    setSaveError(
      "저장되지 않았습니다. 화면 위의 안내문을 확인한 뒤 다시 눌러 주세요."
    );
  };

  return (
    <section className={easyMode ? "panel easy-job-panel" : "panel"}>
      <div className="panel-title easy-panel-title">
        <div>
          <h2>{editingJob ? "작업일지 수정" : "작업입력"}</h2>
          <p>
            {easyMode
              ? "화면에 보이는 순서대로 입력하면 됩니다."
              : "전체 입력항목을 한 화면에서 확인합니다."}
          </p>
        </div>

        <div className="easy-title-actions">
          <button
            type="button"
            className="easy-mode-toggle"
            onClick={() => setEasyMode((current) => !current)}
          >
            {easyMode ? "전체보기" : "쉬운입력"}
          </button>

          <button
            type="button"
            className="text-button"
            onClick={editingJob ? onCancelEdit : onBack}
          >
            {editingJob ? "수정 취소" : "목록으로"}
          </button>
        </div>
      </div>

      {easyMode && (
        <>
          <div className="easy-help-banner">
            <strong>어렵게 생각하지 마세요.</strong>
            <span>주소 → 작업내용 → 금액 순서로 세 번만 진행하면 저장됩니다.</span>
          </div>

          <div className="easy-step-nav">
            <StepButton
              number="1"
              label="현장정보"
              active={step === 1}
              done={step > 1}
              onClick={() => setStep(1)}
            />
            <StepButton
              number="2"
              label="작업내용"
              active={step === 2}
              done={step > 2}
              onClick={() => step > 1 && setStep(2)}
            />
            <StepButton
              number="3"
              label="금액·저장"
              active={step === 3}
              done={false}
              onClick={() => step > 2 && setStep(3)}
            />
          </div>
        </>
      )}

      <div className="job-form">
        {editingJob && (
          <div className="edit-mode-banner">
            <div>
              <strong>수정 중입니다</strong>
              <span>
                {editingJob.workDate} · {editingJob.address}
              </span>
            </div>
            <button type="button" onClick={onCancelEdit}>
              취소
            </button>
          </div>
        )}

        {showStep(1) && (
          <div className="easy-step-content">
            <div className="easy-section-heading">
              <span>1</span>
              <div>
                <h3>현장정보 입력</h3>
                <p>캡처가 있으면 먼저 사진을 선택하세요.</p>
              </div>
            </div>

            <OrderOCR
              onResult={({ phone, address }) =>
                setForm((current) => ({
                  ...current,
                  phone: phone || current.phone,
                  address: address || current.address
                }))
              }
              onNotice={onNotice}
            />

            {customerHistory.length > 0 && (
              <div className="existing-customer-box">
                <strong>전에 방문한 현장입니다.</strong>
                <span>
                  이전 방문 {customerHistory.length}건 · 최근{" "}
                  {customerHistory[0]?.workDate} ·{" "}
                  {customerHistory[0]?.jobType}
                </span>
              </div>
            )}

            <div className="form-section easy-primary-section">
              <Field label="작업종류">
                <div className="choice-grid easy-choice-grid">
                  {JOB_TYPES.map((type) => (
                    <button
                      type="button"
                      key={type}
                      className={
                        form.jobType === type ? "choice active" : "choice"
                      }
                      onClick={() => setForm({ ...form, jobType: type })}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="현장 주소" required>
                <input
                  className="easy-large-input"
                  value={form.address}
                  onChange={(event) =>
                    setForm({ ...form, address: event.target.value })
                  }
                  placeholder="예: 평택시 고덕동 123"
                />
              </Field>

              <Field label="연락처">
                <input
                  className="easy-large-input"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone: normalizePhone(event.target.value)
                    })
                  }
                  placeholder="예: 010-1234-5678"
                />
              </Field>


              {canSelectBusiness ? (
              <div className="document-business-select-box">
                <Field label="문서에 표시할 상호">
                  <select
                    value={form.issuerBusinessId || "own"}
                    onChange={(event) => {
                      const business = businessOptions.find(
                        (item) => item.id === event.target.value
                      );

                      setForm({
                        ...form,
                        issuerBusinessId: event.target.value,
                        issuerBusinessSnapshot: business || null
                      });
                    }}
                  >
                    {businessOptions.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.businessName || "내 업체정보 미등록"}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="selected-business-card">
                  <div>
                    <span>선택 상호</span>
                    <strong>
                      {selectedBusiness?.businessName || "업체정보 미등록"}
                    </strong>
                  </div>
                  <div>
                    <span>사업자등록번호</span>
                    <strong>
                      {selectedBusiness?.businessNumber || "미입력"}
                    </strong>
                  </div>
                  <div>
                    <span>대표자</span>
                    <strong>
                      {selectedBusiness?.representativeName || "미입력"}
                    </strong>
                  </div>
                  <p>
                    문서만 선택한 상호로 발행되며, 작업 수입은 현재 로그인한
                    사용자에게 그대로 집계됩니다.
                  </p>
                </div>
              </div>
              ) : (
                <div className="selected-business-card own-business-card">
                  <div><span>문서 상호</span><strong>{profile.businessName || "내 업체정보 미등록"}</strong></div>
                  <div><span>사업자등록번호</span><strong>{profile.businessNumber || "미입력"}</strong></div>
                </div>
              )}

              <div className="two-column">
                <Field label="작업일">
                  <input
                    type="date"
                    value={form.workDate}
                    onChange={(event) =>
                      setForm({ ...form, workDate: event.target.value })
                    }
                  />
                </Field>

                <Field label="작업자">
                  <input
                    value={form.worker}
                    onChange={(event) =>
                      setForm({ ...form, worker: event.target.value })
                    }
                    placeholder="자동 입력"
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

        {showStep(2) && (
          <div className="easy-step-content">
            <div className="easy-section-heading">
              <span>2</span>
              <div>
                <h3>작업내용 입력</h3>
                <p>진행한 작업을 눌러 문장을 자동으로 만드세요.</p>
              </div>
            </div>

            {form.jobType === "누수탐지" ? (
              <LeakOpinionEngine
                leakData={leakData}
                setLeakData={setLeakData}
                job={form}
              />
            ) : (
              <WorkTemplateEngine
                jobType={form.jobType}
                form={form}
                setForm={setForm}
              />
            )}

            <div className="form-section">
              <Field label="작업내용" required>
                <textarea
                  className="easy-large-textarea"
                  rows="7"
                  value={form.workContent}
                  onChange={(event) =>
                    setForm({ ...form, workContent: event.target.value })
                  }
                  placeholder="위 템플릿을 사용하거나 직접 입력하세요."
                />
              </Field>

              <Field label="작업결과">
                <textarea
                  rows="3"
                  value={form.result}
                  onChange={(event) =>
                    setForm({ ...form, result: event.target.value })
                  }
                  placeholder="예: 통수 확인 완료"
                />
              </Field>

              <Field label="사용 장비">
                <div className="choice-grid">
                  {EQUIPMENT.map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={
                        form.equipment.includes(item)
                          ? "choice active"
                          : "choice"
                      }
                      onClick={() => toggleEquipment(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="AS 기간">
                <select
                  value={form.asPeriod}
                  onChange={(event) =>
                    setForm({ ...form, asPeriod: event.target.value })
                  }
                >
                  <option>없음</option>
                  <option>3개월</option>
                  <option>6개월</option>
                  <option>1년</option>
                  <option>2년</option>
                  <option>3년</option>
                </select>
              </Field>
            </div>

            <div className="form-section">
              <div className="photo-section-title">
                <div>
                  <h3>현장 사진</h3>
                  <p className="easy-photo-help">
                    사진이 없으면 건너뛰어도 됩니다.
                  </p>
                </div>
                <strong>
                  사진 {beforePhotos.length + duringPhotos.length + afterPhotos.length}장 · 동영상 {videos.length}개
                </strong>
              </div>
              <PhotoField
                title="작업 전"
                folder="before"
                files={beforePhotos}
                onChange={setBeforePhotos}
                onNotice={onNotice}
              />
              <PhotoField
                title="작업 중"
                folder="during"
                files={duringPhotos}
                onChange={setDuringPhotos}
                onNotice={onNotice}
              />
              <PhotoField
                title="작업 후"
                folder="after"
                files={afterPhotos}
                onChange={setAfterPhotos}
                onNotice={onNotice}
              />
              <VideoField
                title="현장 동영상"
                folder="videos"
                files={videos}
                onChange={setVideos}
                onNotice={onNotice}
              />
            </div>
          </div>
        )}

        {showStep(3) && (
          <div className="easy-step-content">
            <div className="easy-section-heading">
              <span>3</span>
              <div>
                <h3>금액 입력</h3>
                <p>청구금액과 실제 받은 금액을 입력하세요.</p>
              </div>
            </div>

            <PaymentBox
              form={form}
              setForm={setForm}
              chargeAmount={chargeAmount}
              materialCost={materialCost}
              commissionBaseAmount={commissionBaseAmount}
              commissionAmount={commissionAmount}
              netAmount={netAmount}
            />


            <div className="form-section followup-input-box">
              <div>
                <h3>재방문·AS 예약</h3>
                <p>필요 없으면 비워두세요.</p>
              </div>

              <div className="two-column">
                <Field label="구분">
                  <select
                    value={form.followUpType || "재방문"}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        followUpType: event.target.value
                      })
                    }
                  >
                    <option>재방문</option>
                    <option>AS</option>
                    <option>예약</option>
                    <option>추가 공사</option>
                  </select>
                </Field>

                <Field label="예정일">
                  <input
                    type="date"
                    value={form.followUpDate || ""}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        followUpDate: event.target.value
                      })
                    }
                  />
                </Field>
              </div>

              <Field label="메모">
                <input
                  value={form.followUpMemo || ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      followUpMemo: event.target.value
                    })
                  }
                  placeholder="예: 오후 2시 방문"
                />
              </Field>
            </div>

            <div className="form-section">
              <Field label="특이사항">
                <textarea
                  rows="3"
                  value={form.memo}
                  onChange={(event) =>
                    setForm({ ...form, memo: event.target.value })
                  }
                  placeholder="없으면 비워두세요."
                />
              </Field>
            </div>

            <div className="easy-review-card">
              <h3>저장 전 확인</h3>
              <div>
                <span>현장</span>
                <strong>{form.address || "주소 미입력"}</strong>
              </div>
              <div>
                <span>작업</span>
                <strong>{form.jobType}</strong>
              </div>
              <div>
                <span>문서 상호</span>
                <strong>
                  {selectedBusiness?.businessName || "업체정보 미등록"}
                </strong>
              </div>
              <div>
                <span>사업자번호</span>
                <strong>{selectedBusiness?.businessNumber || "미입력"}</strong>
              </div>
              <div>
                <span>작업금액</span>
                <strong>{formatWon(chargeAmount)}</strong>
              </div>
              <div>
                <span>자재비</span>
                <strong>{formatWon(materialCost)}</strong>
              </div>
              <div>
                <span>수수료</span>
                <strong>{formatWon(commissionAmount)}</strong>
              </div>
              <div>
                <span>실수령금액</span>
                <strong>{formatWon(netAmount)}</strong>
              </div>
            </div>
          </div>
        )}

        {!easyMode && (
          <details className="profile-settings-box">
            <summary>업체정보 설정</summary>
            <ProfileBox
              profile={profile}
              setProfile={setProfile}
              stampFile={stampFile}
              setStampFile={setStampFile}
              onSave={onProfileSave}
              saving={profileSaving}
            />
          </details>
        )}

        {easyMode ? (
          <div className="easy-sticky-actions">
            {step > 1 ? (
              <button
                type="button"
                className="easy-back-button"
                onClick={goPrevious}
              >
                이전
              </button>
            ) : (
              <button
                type="button"
                className="easy-back-button"
                onClick={editingJob ? onCancelEdit : onBack}
              >
                취소
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                className="primary easy-next-button"
                onClick={goNext}
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                className="primary easy-save-button"
                disabled={saving}
                onClick={requestSave}
              >
                {saving
                  ? "저장 중..."
                  : editingJob
                  ? "수정 내용 확인"
                  : "저장 내용 확인"}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="primary save-button"
            disabled={saving}
            onClick={requestSave}
          >
            {saving
              ? "저장 중..."
              : editingJob
              ? "수정 내용 확인"
              : "저장 내용 확인"}
          </button>
        )}

        {saveConfirmOpen && (
          <div
            className="save-confirm-backdrop"
            onClick={() => !saving && setSaveConfirmOpen(false)}
          >
            <section
              className="save-confirm-card"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="save-confirm-icon">✓</div>
              <h2>이 내용으로 저장할까요?</h2>

              <div className="save-confirm-summary">
                <div>
                  <span>현장</span>
                  <strong>{form.address || "-"}</strong>
                </div>
                <div>
                  <span>작업</span>
                  <strong>{form.jobType || "-"}</strong>
                </div>
                <div>
                  <span>작업자</span>
                  <strong>{form.worker || "-"}</strong>
                </div>
                <div>
                  <span>문서 상호</span>
                  <strong>
                    {selectedBusiness?.businessName || "업체정보 미등록"}
                  </strong>
                </div>
                <div>
                  <span>사업자번호</span>
                  <strong>{selectedBusiness?.businessNumber || "미입력"}</strong>
                </div>
                <div>
                  <span>청구금액</span>
                  <strong>{formatWon(chargeAmount)}</strong>
                </div>
                <div>
                  <span>자재비</span>
                  <strong>{formatWon(materialCost)}</strong>
                </div>
                <div>
                  <span>수수료</span>
                  <strong>{formatWon(commissionAmount)}</strong>
                </div>
                <div>
                  <span>실수령금액</span>
                  <strong>{formatWon(netAmount)}</strong>
                </div>
                <div>
                  <span>받은 금액</span>
                  <strong>{formatWon(paymentTotal)}</strong>
                </div>
                {form.followUpDate && (
                  <div>
                    <span>{form.followUpType || "재방문"}</span>
                    <strong>{form.followUpDate}</strong>
                  </div>
                )}
              </div>

              {saveError && (
                <p className="save-confirm-error">{saveError}</p>
              )}

              <div className="save-confirm-actions">
                <button
                  type="button"
                  className="save-confirm-cancel"
                  onClick={() => setSaveConfirmOpen(false)}
                  disabled={saving}
                >
                  다시 확인
                </button>
                <button
                  type="button"
                  className="primary save-confirm-submit"
                  onClick={confirmSave}
                  disabled={saving}
                >
                  {saving ? "저장 중..." : "확인하고 저장"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
