import { useMemo, useState } from "react";
import { formatWon } from "../utils/formatters";
import { summarizeMonth } from "../utils/settlement";

function Card({label,value,emphasize}) { return <div className={emphasize?"settlement-card emphasize":"settlement-card"}><span>{label}</span><strong>{formatWon(value)}</strong></div>; }
export default function MonthlySettlement({jobs,role,onOpenJob}) {
 const [month,setMonth]=useState(new Date().toISOString().slice(0,7));
 const summary=useMemo(()=>summarizeMonth(jobs,month),[jobs,month]);
 const full=role==="대표"||role==="최고관리자";
 return <section className="panel">
  <div className="panel-title settlement-title"><div><h2>{full?"월별 금액 현황":"내 작업 합계"}</h2></div><input className="month-picker" type="month" value={month} onChange={e=>setMonth(e.target.value)} /></div>
  <div className="settlement-job-count"><span>{month.replace("-","년 ")}월</span><strong>{summary.jobCount}건</strong></div>
  <div className="settlement-summary-grid worker-own-summary"><Card label={full?"작업금액 합계":"내 작업금액 합계"} value={summary.totalCharge} emphasize/><Card label={full?"자재비 합계":"내 자재비 합계"} value={summary.totalMaterialCost}/><Card label="수수료 합계" value={summary.totalCommission}/><Card label="실수령 합계" value={summary.totalNetAmount}/></div>
  <div className="settlement-list"><h3>{full?"작업별 금액 내역":"내 작업 내역"}</h3>{summary.jobs.length===0?<div className="empty">선택한 달의 작업이 없습니다.</div>:summary.jobs.map(job=><article className="settlement-job-card" key={`${job.ownerUid||""}-${job.id}`} onClick={()=>onOpenJob(job)}><div className="settlement-job-head"><div><strong>{job.workDate} · {job.jobType}</strong><span>{job.address}</span>{full&&job.worker&&<span>작업자 {job.worker}</span>}</div><strong>{formatWon(job.chargeAmount)}</strong></div><div className="settlement-payment-tags"><span>자재비 {formatWon(job.materialCost)}</span><span>수수료 {formatWon(job.commissionAmount)}</span><span>실수령 {formatWon(job.netAmount)}</span></div></article>)}</div>
 </section>;
}
