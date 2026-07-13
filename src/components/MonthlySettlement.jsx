import { useMemo, useState } from "react";
import { formatWon } from "../utils/formatters";
import { summarizeMonth } from "../utils/settlement";
import { downloadMonthlyCsv } from "../utils/csv";

function Card({ label, value, emphasize }) {
  return (
    <div className={emphasize ? "settlement-card emphasize" : "settlement-card"}>
      <span>{label}</span>
      <strong>{formatWon(value)}</strong>
    </div>
  );
}

export default function MonthlySettlement({ jobs, role, onOpenJob }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const summary = useMemo(() => summarizeMonth(jobs, month), [jobs, month]);
  const canViewFull =
    role === "대표" || role === "최고관리자";

  return (
    <section className="panel">
      <div className="panel-title settlement-title">
        <div>
          <h2>{canViewFull ? "월별 정산" : "내 작업 합계"}</h2>
          {!canViewFull && (
            <p className="settlement-role-guide">
              본인이 작성한 작업의 금액과 자재비 합계만 표시됩니다.
            </p>
          )}
        </div>

        <div className="settlement-title-actions">
          {canViewFull && (
            <button
              type="button"
              className="csv-button"
              onClick={() => downloadMonthlyCsv(summary, month)}
              disabled={!summary.jobCount}
            >
              CSV 저장
            </button>
          )}
          <input
            className="month-picker"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </div>
      </div>

      <div className="settlement-job-count">
        <span>{month.replace("-", "년 ")}월</span>
        <strong>{summary.jobCount}건</strong>
      </div>

      {canViewFull ? (
        <>
          <div className="settlement-summary-grid settlement-finance-grid">
            <Card label="총 청구금액" value={summary.totalCharge} />
            <Card label="원금 합계" value={summary.totalBaseCharge} />
            <Card label="총 자재비" value={summary.totalMaterialCost} />
            <Card
              label="정산 기준"
              value={summary.totalSettlementBase}
              emphasize
            />
            <Card label="기사 지급 60%" value={summary.totalWorkerShare} />
            <Card label="본사 수익 40%" value={summary.totalCompanyShare} />
          </div>

          <div className="settlement-summary-grid">
            <Card label="현금" value={summary.cash} />
            <Card label="계좌입금" value={summary.transfer} />
            <Card label="카드" value={summary.card} />
            <Card label="계산서 발행" value={summary.invoice} />
            <Card label="결제 합계" value={summary.totalPaid} />
          </div>

          <div className={
            summary.difference === 0
              ? "settlement-balance match"
              : "settlement-balance mismatch"
          }>
            <span>청구금액과 결제 합계 차이</span>
            <strong>
              {summary.difference === 0
                ? "0원 · 모두 일치"
                : `${summary.difference > 0 ? "부족" : "초과"} ${formatWon(
                    Math.abs(summary.difference)
                  )}`}
            </strong>
          </div>
        </>
      ) : (
        <div className="settlement-summary-grid worker-own-summary">
          <Card label="내 작업금액 합계" value={summary.totalCharge} emphasize />
          <Card label="내 자재비 합계" value={summary.totalMaterialCost} />
        </div>
      )}

      <div className="settlement-list">
        <h3>{canViewFull ? "작업별 정산 내역" : "내 작업 내역"}</h3>

        {summary.jobs.length === 0 ? (
          <div className="empty">선택한 달의 작업이 없습니다.</div>
        ) : (
          summary.jobs.map((job) => (
            <article
              className="settlement-job-card"
              key={`${job.ownerUid || ""}-${job.id}`}
              onClick={() => onOpenJob(job)}
            >
              <div className="settlement-job-head">
                <div>
                  <strong>{job.workDate} · {job.jobType}</strong>
                  <span>{job.address}</span>
                  {canViewFull && job.worker && (
                    <span>작업자 {job.worker}</span>
                  )}
                </div>
                <strong>{formatWon(job.chargeAmount)}</strong>
              </div>

              <div className="settlement-payment-tags">
                <span>자재비 {formatWon(job.materialCost)}</span>
                {canViewFull && (
                  <>
                    <span>정산 기준 {formatWon(job.settlementBaseAmount)}</span>
                    <span>기사 60% {formatWon(job.workerShareAmount)}</span>
                    <span>본사 40% {formatWon(job.companyShareAmount)}</span>
                  </>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
