import { useMemo, useState } from "react";
import { formatWon } from "../utils/formatters";
import { summarizeMonth } from "../utils/settlement";

function Card({ label, value, emphasize }) {
  return <div className={emphasize ? "settlement-card emphasize" : "settlement-card"}><span>{label}</span><strong>{formatWon(value)}</strong></div>;
}

export default function MonthlySettlement({ jobs, onOpenJob }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedWorker, setSelectedWorker] = useState("");
  const summary = useMemo(() => summarizeMonth(jobs, month), [jobs, month]);

  const workerGroups = useMemo(() => {
    const groups = new Map();
    summary.jobs.forEach((job) => {
      const key = job.assignedWorkerUid || job.worker || "미지정";
      const current = groups.get(key) || {
        key,
        worker: job.worker || "미지정",
        jobCount: 0,
        completedCount: 0,
        pendingCount: 0,
        totalCharge: 0,
        totalMaterialCost: 0,
        totalSettlementBase: 0,
        totalWorkerAmount: 0,
        totalOfficeAmount: 0,
        jobs: []
      };
      current.jobCount += 1;
      current.totalCharge += job.chargeAmount;
      current.totalMaterialCost += job.materialCost;
      current.totalSettlementBase += job.settlementBaseAmount;
      current.totalWorkerAmount += job.workerAmount;
      current.totalOfficeAmount += job.officeAmount;
      if (job.settlementStatus === "completed") current.completedCount += 1;
      else current.pendingCount += 1;
      current.jobs.push(job);
      groups.set(key, current);
    });
    return Array.from(groups.values()).sort((a, b) => b.totalWorkerAmount - a.totalWorkerAmount);
  }, [summary.jobs]);

  const visibleJobs = selectedWorker
    ? workerGroups.find((item) => item.key === selectedWorker)?.jobs || []
    : summary.jobs;

  return <section className="panel">
    <div className="panel-title settlement-title"><div><h2>월별 기사·본사 정산</h2><p>건별로 저장된 비율을 그대로 합산합니다.</p></div><input className="month-picker" type="month" value={month} onChange={(event) => { setMonth(event.target.value); setSelectedWorker(""); }} /></div>

    <div className="settlement-job-count"><span>{month.replace("-", "년 ")}월</span><strong>{summary.jobCount}건</strong></div>
    <div className="settlement-status-row"><span className="settlement-complete-chip">정산완료 {summary.completedCount}건</span><span className="settlement-pending-chip">정산대기 {summary.pendingCount}건</span></div>

    <div className="settlement-summary-grid worker-own-summary">
      <Card label="총 매출" value={summary.totalCharge} />
      <Card label="총 자재비" value={summary.totalMaterialCost} />
      <Card label="총 정산기준" value={summary.totalSettlementBase} />
      <Card label="기사 총수입" value={summary.totalWorkerAmount} emphasize />
      <Card label="본사 총수입" value={summary.totalOfficeAmount} emphasize />
    </div>

    <div className="final-ratio-box"><span>최종 기사 : 본사</span><strong>{formatWon(summary.totalWorkerAmount)} : {formatWon(summary.totalOfficeAmount)}</strong></div>

    <div className="worker-settlement-grid">
      {workerGroups.map((group) => <button type="button" key={group.key} className={selectedWorker === group.key ? "worker-settlement-card selected" : "worker-settlement-card"} onClick={() => setSelectedWorker((current) => current === group.key ? "" : group.key)}>
        <div><strong>{group.worker}</strong><span>{group.jobCount}건 · 대기 {group.pendingCount}건</span></div>
        <dl><div><dt>기사 총수입</dt><dd>{formatWon(group.totalWorkerAmount)}</dd></div><div><dt>본사 금액</dt><dd>{formatWon(group.totalOfficeAmount)}</dd></div></dl>
      </button>)}
    </div>

    <div className="settlement-list"><h3>{selectedWorker ? `${workerGroups.find((item) => item.key === selectedWorker)?.worker || "기사"} 작업별 정산` : "전체 작업별 정산"}</h3>
      {visibleJobs.length === 0 ? <div className="empty">선택한 달의 작업이 없습니다.</div> : visibleJobs.sort((a, b) => `${b.workDate}${b.visitTime || ""}`.localeCompare(`${a.workDate}${a.visitTime || ""}`)).map((job) => <article className="settlement-job-card" key={`${job.ownerUid || ""}-${job.id}`} onClick={() => onOpenJob(job)}>
        <div className="settlement-job-head"><div><strong>{job.workDate} · {job.jobType}</strong><span>{job.address}</span><span>담당기사 {job.worker || "미지정"}</span></div><strong>{formatWon(job.chargeAmount)}</strong></div>
        <div className="settlement-payment-tags"><span>자재비 {formatWon(job.materialCost)}</span><span>정산기준 {formatWon(job.settlementBaseAmount)}</span>{job.settlementStatus === "completed" ? <><span>기사 {job.workerRate}% · {formatWon(job.workerAmount)}</span><span>본사 {job.officeRate}% · {formatWon(job.officeAmount)}</span></> : <span className="pending-text">정산대기</span>}</div>
      </article>)}
    </div>
  </section>;
}
