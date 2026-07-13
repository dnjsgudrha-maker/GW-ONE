export default function MoreMenu({
  role,
  onOpenCustomers,
  onOpenSettlement,
  onOpenUsers,
  onOpenProfile,
  onOpenHelp,
  onInstall,
  onBackup,
  onToggleLargeText,
  largeText,
  onEnableNotifications,
  notificationPermission,
  installAvailable
}) {
  const canViewSettlement = true;
  const canManageUsers = role === "최고관리자";

  return (
    <section className="panel easy-more-page">
      <div className="panel-title">
        <div>
          <h2>더보기</h2>
          <p>필요한 메뉴만 크게 모았습니다.</p>
        </div>
        <span className="role-chip">{role}</span>
      </div>

      <div className="more-menu-grid">
        <button onClick={onOpenCustomers}>
          <span>👤</span>
          <strong>고객관리</strong>
          <small>이전 방문 찾기</small>
        </button>

        {canViewSettlement && (
          <button onClick={onOpenSettlement}>
            <span>₩</span>
            <strong>{role === "기사" ? "내 작업 합계" : "월별정산"}</strong>
            <small>
              {role === "기사"
                ? "내 작업금액·자재비"
                : "전체 6:4 정산 확인"}
            </small>
          </button>
        )}

        {canManageUsers && (
          <button onClick={onOpenUsers}>
            <span>👥</span>
            <strong>사용자관리</strong>
            <small>승인·권한 변경</small>
          </button>
        )}

        <button onClick={onOpenProfile}>
          <span>⚙</span>
          <strong>내 업체정보</strong>
          <small>상호·대표자·직인</small>
        </button>

        <button onClick={onOpenHelp}>
          <span>❓</span>
          <strong>사용방법</strong>
          <small>처음 쓰는 분 안내</small>
        </button>

        <button onClick={onToggleLargeText}>
          <span>가</span>
          <strong>{largeText ? "기본 글씨" : "큰 글씨"}</strong>
          <small>{largeText ? "일반 크기로 보기" : "글씨와 버튼 크게 보기"}</small>
        </button>

        <button onClick={onBackup}>
          <span>💾</span>
          <strong>데이터 백업</strong>
          <small>작업내역 파일로 저장</small>
        </button>

        {canViewSettlement && (
          <button onClick={onEnableNotifications}>
            <span>🔔</span>
            <strong>
              {notificationPermission === "granted"
                ? "작업 알림 켜짐"
                : "작업 알림 켜기"}
            </strong>
            <small>
              {notificationPermission === "granted"
                ? "기사 작업등록 시 바로 알림"
                : "브라우저 알림 권한 허용"}
            </small>
          </button>
        )}

        {installAvailable && (
          <button onClick={onInstall}>
            <span>📲</span>
            <strong>휴대폰에 설치</strong>
            <small>홈 화면에서 바로 실행</small>
          </button>
        )}
      </div>

      <div className="version-box">
        <strong>GW ONE v4.1</strong>
        <span>현장 실사용 완성 버전</span>
      </div>
    </section>
  );
}
