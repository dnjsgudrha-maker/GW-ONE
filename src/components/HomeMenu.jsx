import { useMemo } from "react";
import { formatWon } from "../utils/formatters";

export default function HomeMenu({
  role,
  onCreateJob,
  onOpenToday,
  onOpenJobs,
  onOpenCustomers,
  onOpenUsers,
  onOpenCollection,
  onOpenProfile,
  onOpenMore,
  jobs = []
}) {
  const isWorker = role === "기사";
  const canManageUsers = role === "최고관리자";
  const sales = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const todayJobs = jobs.filter((job) => job.workDate === today);
    const monthJobs = jobs.filter((job) => String(job.workDate || "").startsWith(month));
    return {
      todayCount: todayJobs.length,
      monthCount: monthJobs.length,
      todayAmount: todayJobs.reduce((sum, job) => sum + Number(job.chargeAmount || 0), 0),
      monthAmount: monthJobs.reduce((sum, job) => sum + Number(job.chargeAmount || 0), 0)
    };
  }, [jobs]);

  return (
    <section className="panel home-menu-page">
      <div className="home-menu-heading">
        <h2>GW ONE</h2>
        <span className="role-chip">{role}</span>
      </div>

      <div className="home-sales-grid">
        <div><span>오늘 작업</span><strong>{sales.todayCount}건</strong></div>
        <div><span>오늘 매출</span><strong>{formatWon(sales.todayAmount)}</strong></div>
        <div><span>이번 달 작업</span><strong>{sales.monthCount}건</strong></div>
        <div><span>이번 달 매출</span><strong>{formatWon(sales.monthAmount)}</strong></div>
      </div>

      <div className="home-menu-grid">
        <button type="button" className="home-menu-primary" onClick={onCreateJob}>
          <span>＋</span>
          <strong>작업등록</strong>
          <small>새 작업 입력</small>
        </button>

        <button type="button" onClick={onOpenToday}>
          <span>▦</span>
          <strong>{isWorker ? "오늘 작업" : "작업현황"}</strong>
          <small>{isWorker ? "오늘 일정 확인" : "전체 현황 확인"}</small>
        </button>

        <button type="button" onClick={onOpenJobs}>
          <span>▤</span>
          <strong>{isWorker ? "작업검색" : "전체 작업"}</strong>
          <small>기록 조회·수정</small>
        </button>

        <button type="button" onClick={onOpenCustomers}>
          <span>⌕</span>
          <strong>고객관리</strong>
          <small>이전 작업 조회</small>
        </button>

        {!isWorker && (
          <button type="button" onClick={onOpenCollection}>
            <span>₩</span>
            <strong>수금관리</strong>
            <small>미수·수금완료</small>
          </button>
        )}

        {canManageUsers && (
          <button type="button" onClick={onOpenUsers}>
            <span>♙</span>
            <strong>기사관리</strong>
            <small>승인·권한 관리</small>
          </button>
        )}

        <button type="button" onClick={onOpenProfile}>
          <span>⚙</span>
          <strong>내 정보</strong>
          <small>업체정보 확인</small>
        </button>

        <button type="button" onClick={onOpenMore}>
          <span>•••</span>
          <strong>더보기</strong>
          <small>설정·백업·도움말</small>
        </button>
      </div>
    </section>
  );
}
