import { useMemo, useState } from "react";

function statusLabel(profile) {
  if (profile.disabled) return "사용 중지";
  if (profile.approved === false) return "승인 대기";
  return "사용 가능";
}

export default function UserManagement({
  profiles,
  currentUid,
  onApprove,
  onDisable,
  onEnable,
  onMakeAdmin,
  onRemoveAdmin,
  onChangeRole,
  adminUids
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return profiles;

    return profiles.filter((profile) =>
      [
        profile.email,
        profile.businessName,
        profile.representativeName,
        profile.contact,
        profile.uid
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [profiles, search]);

  return (
    <section className="panel">
      <div className="panel-title">
        <h2>사용자 관리</h2>
        <span className="user-count">{profiles.length}명</span>
      </div>

      <input
        className="search"
        placeholder="이메일, 상호명, 대표자명 검색"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="user-list">
        {filtered.length === 0 ? (
          <div className="empty">사용자가 없습니다.</div>
        ) : (
          filtered.map((profile) => {
            const isAdmin = adminUids.includes(profile.uid);
            const isSelf = profile.uid === currentUid;

            return (
              <article className="user-card" key={profile.uid}>
                <div className="user-card-head">
                  <div>
                    <strong>
                      {profile.businessName ||
                        profile.representativeName ||
                        "업체정보 미등록"}
                    </strong>
                    <span>{profile.email || "-"}</span>
                  </div>

                  <span
                    className={
                      profile.disabled
                        ? "user-status disabled"
                        : profile.approved === false
                        ? "user-status pending"
                        : "user-status approved"
                    }
                  >
                    {statusLabel(profile)}
                  </span>
                </div>

                <div className="user-detail-grid">
                  <div>
                    <span>대표자</span>
                    <strong>{profile.representativeName || "-"}</strong>
                  </div>
                  <div>
                    <span>연락처</span>
                    <strong>{profile.contact || "-"}</strong>
                  </div>
                  <div>
                    <span>권한</span>
                    <strong>{isAdmin ? "관리자" : profile.role || "기사"}</strong>
                  </div>
                  <div>
                    <span>UID</span>
                    <strong className="uid-text">{profile.uid}</strong>
                  </div>
                </div>

                {!isAdmin && (
                  <div className="role-selector">
                    <span>사용자 역할</span>
                    <select
                      value={profile.role || "기사"}
                      onChange={(event) =>
                        onChangeRole(profile.uid, event.target.value)
                      }
                    >
                      <option value="기사">기사</option>
                      <option value="대표">대표</option>
                    </select>
                  </div>
                )}

                <div className="user-actions">
                  {profile.approved === false && !profile.disabled && (
                    <button
                      className="approve"
                      onClick={() => onApprove(profile.uid)}
                    >
                      승인
                    </button>
                  )}

                  {!profile.disabled && !isSelf && (
                    <button
                      className="disable"
                      onClick={() => onDisable(profile.uid)}
                    >
                      사용 중지
                    </button>
                  )}

                  {profile.disabled && (
                    <button
                      className="enable"
                      onClick={() => onEnable(profile.uid)}
                    >
                      다시 사용
                    </button>
                  )}

                  {!isAdmin && (
                    <button
                      className="admin"
                      onClick={() => onMakeAdmin(profile.uid)}
                    >
                      관리자 지정
                    </button>
                  )}

                  {isAdmin && !isSelf && (
                    <button
                      className="remove-admin"
                      onClick={() => onRemoveAdmin(profile.uid)}
                    >
                      관리자 해제
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
