import { useMemo, useState } from "react";
import { formatWon } from "../utils/formatters";

function settlementBase(job) {
  const base = Number(job.baseChargeAmount || job.chargeAmount || 0);
  const material = Number(job.materialCost || 0);
  return Math.max(base - material, 0);
}

export default function WorkerSettlement({
  jobs,
  profiles,
  onOpenJob
}) {
  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [workerUid, setWorkerUid] = useState("all");

  const workers = useMemo(() => {
    const map = new Map();

    for (const profile of profiles || []) {
      if (
        profile?.uid &&
        profile?.approved !== false &&
        profile?.disabled !== true &&
        profile?.role === "기사"
      ) {
        map.set(profile.uid, {
          uid: profile.uid,
          name:
            profile.representativeName ||
            profile.businessName ||
            profile.email ||
            "이름 미등록",
          email: profile.email || ""
        });
      }
    }

    for (const job of jobs || []) {
      const uid = job.ownerUid || job.assignedWorkerUid;
      if (!uid || map.has(uid)) continue;

      map.set(uid, {
        uid,
        name: job.worker || job.ownerEmail || "작업자 미등록",
        email: job.ownerEmail || ""
      });
    }

    return [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "ko")
    );
  }, [jobs, profiles]);

  const data = useMemo(() => {
    const monthJobs = (jobs || [])
      .filter((job) =>
        String(job.workDate || "").startsWith(month)
      )
      .filter((job) =>
        workerUid === "all"
          ? true
          : (job.ownerUid || job.assignedWorkerUid) === workerUid
      )
      .sort((a, b) =>
        String(b.workDate || "").localeCompare(String(a.workDate || ""))
      );

    const totalCharge = monthJobs.reduce(
      (sum, job) =>
        sum + Number(job.baseChargeAmount || job.chargeAmount || 0),
      0
    );
    const totalMaterial = monthJobs.reduce(
      (sum, job) => sum + Number(job.materialCost || 0),
      0
    );
    const totalBase = monthJobs.reduce(
      (sum, job) => sum + settlementBase(job),
      0
    );
    const workerShare = Math.round(totalBase * 0.6);
    const companyShare = Math.max(totalBase - workerShare, 0);

    return {
      jobs: monthJobs,
      totalCharge,
      totalMaterial,
      totalBase,
      workerShare,
      companyShare
    };
  }, [jobs, month, workerUid]);

  return (
    <section className="panel worker-settlement-page">
      <div className="panel-title worker-settlement-title">
        <div>
          <h2>기사별 6:4 정산</h2>
          <p>기사에게는 공개되지 않는 관리자 전용 화면입니다.</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        />
      </div>

      <label className="worker-settlement-filter">
        <span>기사 선택</span>
        <select
          value={workerUid}
          onChange={(event) => setWorkerUid(event.target.value)}
        >
          <option value="all">전체 기사</option>
          {workers.map((worker) => (
            <option key={worker.uid} value={worker.uid}>
              {worker.name}
            </option>
          ))}
        </select>
      </label>

      <div className="worker-settlement-summary">
        <div>
          <span>작업 건수</span>
          <strong>{data.jobs.length}건</strong>
        </div>
        <div>
          <span>원금 합계</span>
          <strong>{formatWon(data.totalCharge)}</strong>
        </div>
        <div>
          <span>자재비 합계</span>
          <strong>{formatWon(data.totalMaterial)}</strong>
        </div>
        <div>
          <span>6:4 정산 기준</span>
          <strong>{formatWon(data.totalBase)}</strong>
          <small>원금 - 자재비</small>
        </div>
        <div className="worker-share">
          <span>기사 60%</span>
          <strong>{formatWon(data.workerShare)}</strong>
        </div>
        <div className="company-share">
          <span>본사 40%</span>
          <strong>{formatWon(data.companyShare)}</strong>
        </div>
      </div>

      <div className="worker-settlement-list">
        <h3>작업 내역</h3>
        {data.jobs.length === 0 ? (
          <div className="empty">선택한 조건의 작업이 없습니다.</div>
        ) : (
          data.jobs.map((job) => {
            const base = settlementBase(job);
            const workerAmount = Math.round(base * 0.6);
            const companyAmount = Math.max(base - workerAmount, 0);

            return (
              <article
                className="worker-settlement-card"
                key={`${job.ownerUid || ""}-${job.id}`}
                onClick={() => onOpenJob(job)}
              >
                <div className="worker-settlement-card-head">
                  <div>
                    <strong>
                      {job.workDate} · {job.jobType}
                    </strong>
                    <span>{job.address}</span>
                    <small>{job.worker || job.ownerEmail || "작업자 미입력"}</small>
                  </div>
                  <strong>{formatWon(base)}</strong>
                </div>
                <div className="worker-settlement-card-values">
                  <span>기사 {formatWon(workerAmount)}</span>
                  <span>본사 {formatWon(companyAmount)}</span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
