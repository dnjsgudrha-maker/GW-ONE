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

export default function MonthlySettlement({ jobs, onOpenJob }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const summary = useMemo(() => summarizeMonth(jobs, month), [jobs, month]);

  return (
    <section className="panel">
      <div className="panel-title settlement-title">
        <h2>월별 정산</h2>
        <div className="settlement-title-actions">
          <button
            type="button"
            className="csv-button"
            onClick={() => downloadMonthlyCsv(summary, month)}
            disabled={!summary.jobCount}
          >
            CSV 저장
          </button>
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

      <div className="settlement-summary-grid">
        <Card label="총 청구금액" value={summary.totalCharge} emphasize />
        <Card label="현금" value={summary.cash} />
        <Card label="계좌입금" value={summary.transfer} />
        <Card label="카드" value={summary.card} />
        <Card label="계산서 발행" value={summary.invoice} />
        <Card label="결제 합계" value={summary.totalPaid} />
      </div>

      <div className={summary.difference === 0 ? "settlement-balance match" : "settlement-balance mismatch"}>
        <span>청구금액과 결제 합계 차이</span>
        <strong>
          {summary.difference === 0
            ? "0원 · 모두 일치"
            : `${summary.difference > 0 ? "부족" : "초과"} ${formatWon(Math.abs(summary.difference))}`}
        </strong>
      </div>

      <div className="settlement-list">
        <h3>작업별 내역</h3>

        {summary.jobs.length === 0 ? (
          <div className="empty">선택한 달의 작업이 없습니다.</div>
        ) : (
          summary.jobs.map((job) => (
            <article
              className="settlement-job-card"
              key={job.id}
              onClick={() => onOpenJob(job)}
            >
              <div className="settlement-job-head">
                <div>
                  <strong>{job.workDate} · {job.jobType}</strong>
                  <span>{job.address}</span>
                </div>
                <strong>{formatWon(job.chargeAmount)}</strong>
              </div>

              <div className="settlement-payment-tags">
                {job.paymentBreakdownResolved.cash > 0 && <span>현금 {formatWon(job.paymentBreakdownResolved.cash)}</span>}
                {job.paymentBreakdownResolved.transfer > 0 && <span>계좌입금 {formatWon(job.paymentBreakdownResolved.transfer)}</span>}
                {job.paymentBreakdownResolved.card > 0 && <span>카드 {formatWon(job.paymentBreakdownResolved.card)}</span>}
                {job.paymentBreakdownResolved.invoice > 0 && <span>계산서 {formatWon(job.paymentBreakdownResolved.invoice)}</span>}
              </div>

              {job.paymentDifferenceResolved !== 0 && (
                <div className="settlement-difference">
                  {job.paymentDifferenceResolved > 0 ? "부족" : "초과"}{" "}
                  {formatWon(Math.abs(job.paymentDifferenceResolved))}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
