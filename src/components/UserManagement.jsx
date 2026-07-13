import { useMemo, useState } from "react";
import { formatBusinessNumber } from "../utils/businessProfile";

function PercentInput({ value, onChange }) {
  return (
    <div className="ratio-input-box">
      <input
        inputMode="numeric"
        value={value}
        onChange={(event) => {
          const next = event.target.value.replace(/\D/g, "").slice(0, 3);
          onChange(next);
        }}
      />
      <span>%</span>
    </div>
  );
}

export default function UserManagement({
  profiles,
  adminUids,
  currentUserUid,
  onApprove,
  onDisable,
  onRoleChange,
  onAdminToggle,
  onSaveRatio,
  onCreateWorker
}) {
  const [workerDraft, setWorkerDraft] = useState({
    representativeName: "",
    email: "",
    contact: "",
    businessName: "",
    businessNumber: "",
    role: "기사",
    workerRatio: "60"
  });
  const [ratioDrafts, setRatioDrafts] = useState({});
  const [showAddWorker, setShowAddWorker] = useState(false);

  const sortedProfiles = useMemo(
    () =>
      [...profiles].sort((a, b) =>
        String(a.representativeName || a.email || "").localeCompare(
          String(b.representativeName || b.email || ""),
          "ko"
        )
      ),
    [profiles]
  );

  const setWorkerField = (key, value) => {
    setWorkerDraft((current) => ({
      ...current,
      [key]: value
    }));
  };

  const createWorker = async () => {
    const ratio = Number(workerDraft.workerRatio || 0);

    if (!workerDraft.representativeName.trim()) {
      window.alert("작업자 이름을 입력해 주세요.");
      return;
    }

    if (!workerDraft.email.trim()) {
      window.alert("로그인할 이메일을 입력해 주세요.");
      return;
    }

    if (ratio < 0 || ratio > 100) {
      window.alert("기사 비율은 0~100 사이로 입력해 주세요.");
      return;
    }

    await onCreateWorker({
      ...workerDraft,
      workerRatio: ratio,
      companyRatio: 100 - ratio
    });

    setWorkerDraft({
      representativeName: "",
      email: "",
      contact: "",
      businessName: "",
      businessNumber: "",
      role: "기사",
      workerRatio: "60"
    });
    setShowAddWorker(false);
  };

  return (
    <section className="panel">
      <div className="panel-title user-management-title">
        <div>
          <h2>작업자 관리</h2>
          <p>작업자 추가, 권한, 정산비율을 관리합니다.</p>
        </div>

        <button
          type="button"
          className="primary compact-button"
          onClick={() => setShowAddWorker((current) => !current)}
        >
          {showAddWorker ? "추가 취소" : "+ 작업자 추가"}
        </button>
      </div>

      {showAddWorker && (
        <div className="worker-add-card">
          <label>
            <span>작업자 이름 *</span>
            <input
              value={workerDraft.representativeName}
              onChange={(event) =>
                setWorkerField("representativeName", event.target.value)
              }
              placeholder="예: 홍길동"
            />
          </label>

          <label>
            <span>로그인 이메일 *</span>
            <input
              type="email"
              value={workerDraft.email}
              onChange={(event) => setWorkerField("email", event.target.value)}
              placeholder="Google 로그인 이메일"
            />
          </label>

          <label>
            <span>연락처</span>
            <input
              value={workerDraft.contact}
              onChange={(event) =>
                setWorkerField("contact", event.target.value)
              }
              placeholder="010-0000-0000"
            />
          </label>

          <label>
            <span>개인사업자 상호</span>
            <input
              value={workerDraft.businessName}
              onChange={(event) =>
                setWorkerField("businessName", event.target.value)
              }
              placeholder="선택 입력"
            />
          </label>

          <label>
            <span>사업자등록번호</span>
            <input
              inputMode="numeric"
              value={workerDraft.businessNumber}
              onChange={(event) =>
                setWorkerField(
                  "businessNumber",
                  formatBusinessNumber(event.target.value)
                )
              }
              placeholder="000-00-00000"
            />
          </label>

          <label>
            <span>권한</span>
            <select
              value={workerDraft.role}
              onChange={(event) => setWorkerField("role", event.target.value)}
            >
              <option value="기사">기사</option>
              <option value="대표">대표</option>
            </select>
          </label>

          <div className="ratio-editor add-worker-ratio">
            <div>
              <span>기사 비율</span>
              <PercentInput
                value={workerDraft.workerRatio}
                onChange={(value) => setWorkerField("workerRatio", value)}
              />
            </div>
            <div>
              <span>본사 비율</span>
              <strong>{100 - Number(workerDraft.workerRatio || 0)}%</strong>
            </div>
          </div>

          <button type="button" className="primary" onClick={createWorker}>
            작업자 등록
          </button>

          <p className="worker-add-guide">
            작업자는 등록된 이메일로 처음 로그인하면 자동으로 연결됩니다.
          </p>
        </div>
      )}

      <div className="user-list">
        {sortedProfiles.length === 0 ? (
          <div className="empty">등록된 사용자가 없습니다.</div>
        ) : (
          sortedProfiles.map((profile) => {
            const isAdmin = adminUids.includes(profile.uid);
            const ratioValue = String(
              ratioDrafts[profile.uid] ??
                profile.workerRatio ??
                60
            );
            const workerRatio = Math.min(
              100,
              Math.max(0, Number(ratioValue || 0))
            );
            const companyRatio = 100 - workerRatio;

            return (
              <article className="user-card" key={profile.uid || profile.email}>
                <div className="user-card-head">
                  <div>
                    <strong>
                      {profile.representativeName ||
                        profile.email ||
                        "이름 미등록"}
                    </strong>
                    <span>{profile.email || "이메일 미등록"}</span>
                  </div>
                  <span className={profile.disabled ? "status off" : "status"}>
                    {profile.disabled
                      ? "사용중지"
                      : profile.approved
                        ? "승인"
                        : "승인대기"}
                  </span>
                </div>

                <div className="user-card-grid">
                  <div>
                    <span>권한</span>
                    <strong>
                      {isAdmin ? "최고관리자" : profile.role || "기사"}
                    </strong>
                  </div>
                  <div>
                    <span>연락처</span>
                    <strong>{profile.contact || "-"}</strong>
                  </div>
                  <div>
                    <span>상호</span>
                    <strong>{profile.businessName || "-"}</strong>
                  </div>
                  <div>
                    <span>사업자번호</span>
                    <strong>{profile.businessNumber || "-"}</strong>
                  </div>
                </div>

                {!isAdmin && (
                  <div className="ratio-management-card">
                    <div className="ratio-management-head">
                      <div>
                        <strong>정산비율</strong>
                        <span>
                          작업 저장 시 현재 비율을 함께 저장해 과거 작업은
                          변경되지 않습니다.
                        </span>
                      </div>
                    </div>

                    <div className="ratio-editor">
                      <div>
                        <span>기사</span>
                        <PercentInput
                          value={ratioValue}
                          onChange={(value) =>
                            setRatioDrafts((current) => ({
                              ...current,
                              [profile.uid]: value
                            }))
                          }
                        />
                      </div>
                      <div>
                        <span>본사</span>
                        <strong>{companyRatio}%</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="secondary ratio-save-button"
                      onClick={() =>
                        onSaveRatio(profile.uid, workerRatio, companyRatio)
                      }
                    >
                      비율 저장
                    </button>
                  </div>
                )}

                <div className="user-actions">
                  {!profile.approved && (
                    <button onClick={() => onApprove(profile.uid)}>
                      승인
                    </button>
                  )}

                  <button
                    onClick={() =>
                      onDisable(profile.uid, !profile.disabled)
                    }
                  >
                    {profile.disabled ? "사용 재개" : "사용 중지"}
                  </button>

                  {!isAdmin && (
                    <select
                      value={profile.role || "기사"}
                      onChange={(event) =>
                        onRoleChange(profile.uid, event.target.value)
                      }
                    >
                      <option value="기사">기사</option>
                      <option value="대표">대표</option>
                    </select>
                  )}

                  {profile.uid !== currentUserUid && (
                    <button
                      className={isAdmin ? "danger" : ""}
                      onClick={() => onAdminToggle(profile.uid, !isAdmin)}
                    >
                      {isAdmin ? "최고관리자 해제" : "최고관리자 지정"}
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
