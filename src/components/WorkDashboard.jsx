import { useMemo, useState } from "react";
import { formatWon } from "../utils/formatters";

function StatCard({ label, value, sub }) {
  return (
    <div className="dashboard-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

export default function WorkDashboard({
  jobs,
  profiles,
  currentRole,
  onOpenJob,
  onCreateJob
}) {
  const [workerFilter, setWorkerFilter] = useState("전체");
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);

  const data = useMemo(() => {
    const todayJobs = jobs.filter((job) => job.workDate === today);
    const monthJobs = jobs.filter((job) =>
      String(job.workDate || "").startsWith(month)
    );

    const todayAmount = todayJobs.reduce(
      (sum, job) => sum + Number(job.chargeAmount || 0),
      0
    );

    const monthAmount = monthJobs.reduce(
      (sum, job) => sum + Number(job.chargeAmount || 0),
      0
    );

    const workers = new Map();

    for (const job of todayJobs) {
      const key = job.ownerUid || job.ownerEmail || job.worker || "미지정";
      const current = workers.get(key) || {
        key,
        name: job.worker || job.ownerEmail || "미지정",
        count: 0,
        amount: 0
      };

      current.count += 1;
      current.amount += Number(job.chargeAmount || 0);
      workers.set(key, current);
    }

    const latestSource =
      workerFilter === "전체"
        ? jobs
        : jobs.filter((job) => {
            const owner = job.ownerUid || job.ownerEmail || job.worker || "미지정";
            return owner === workerFilter;
          });

    const upcomingFollowUps = jobs
      .filter((job) => job.followUpDate)
      .map((job) => ({
        ...job,
        daysUntil: Math.ceil(
          (new Date(`${job.followUpDate}T00:00:00`) -
            new Date(`${today}T00:00:00`)) /
            86400000
        )
      }))
      .filter((job) => job.daysUntil >= 0 && job.daysUntil <= 30)
      .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate))
      .slice(0, 8);

    const latest = [...latestSource]
      .sort((a, b) => {
        const aDate = String(a.workDate || "");
        const bDate = String(b.workDate || "");
        return bDate.localeCompare(aDate);
      })
      .slice(0, 12);

    return {
      todayJobs,
      monthJobs,
      todayAmount,
      monthAmount,
      workers: [...workers.values()].sort((a, b) => b.count - a.count),
      latest,
      upcomingFollowUps
    };
  }, [jobs, today, month, workerFilter]);

  const profileMap = useMemo(() => {
    const map = new Map();
    for (const profile of profiles || []) {
      map.set(profile.uid, profile);
    }
    return map;
  }, [profiles]);

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <h2>실시간 작업 현황</h2>
          <p>
            {currentRole === "기사"
              ? "내 작업 현황입니다."
              : "전체 사용자의 작업 현황입니다."}
          </p>
        </div>
        <span className="role-chip">{currentRole}</span>
      </div>

      <button
        type="button"
        className="dashboard-big-create-button"
        onClick={onCreateJob}
      >
        <span>＋</span>
        <div>
          <strong>새 작업 입력</strong>
          <small>여기를 누르고 순서대로 입력하세요.</small>
        </div>
      </button>

      <div className="dashboard-stat-grid">
        <StatCard label="오늘 작업" value={`${data.todayJobs.length}건`} />
        <StatCard
          label="오늘 청구"
          value={formatWon(data.todayAmount)}
        />
        <StatCard label="이번 달 작업" value={`${data.monthJobs.length}건`} />
        <StatCard
          label="이번 달 청구"
          value={formatWon(data.monthAmount)}
        />
      </div>

      {currentRole !== "기사" && (
        <section className="panel dashboard-worker-panel">
          <div className="panel-title">
            <h2>오늘 기사별 현황</h2>
          </div>

          <div className="worker-status-list">
            {data.workers.length === 0 ? (
              <div className="empty">오늘 저장된 작업이 없습니다.</div>
            ) : (
              data.workers.map((worker) => {
                const profile = profileMap.get(worker.key);

                return (
                  <div className="worker-status-card" key={worker.key}>
                    <div>
                      <strong>
                        {profile?.representativeName ||
                          profile?.businessName ||
                          worker.name}
                      </strong>
                      <span>{profile?.email || ""}</span>
                    </div>
                    <div>
                      <strong>{worker.count}건</strong>
                      <span>{formatWon(worker.amount)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}


      {data.upcomingFollowUps.length > 0 && (
        <section className="panel followup-panel">
          <div className="panel-title">
            <h2>예정된 방문·AS</h2>
            <span className="dashboard-count">
              {data.upcomingFollowUps.length}건
            </span>
          </div>

          <div className="followup-list">
            {data.upcomingFollowUps.map((job) => (
              <article
                className="followup-card"
                key={`followup-${job.id}`}
                onClick={() => onOpenJob(job)}
              >
                <div>
                  <strong>
                    {job.followUpType || "재방문"} · {job.followUpDate}
                  </strong>
                  <span>{job.address}</span>
                </div>
                <span className={job.daysUntil === 0 ? "today" : ""}>
                  {job.daysUntil === 0
                    ? "오늘"
                    : `${job.daysUntil}일 후`}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-title dashboard-latest-title">
          <h2>최근 작업</h2>
          <div className="dashboard-latest-actions">
            {currentRole !== "기사" && (
              <select
                value={workerFilter}
                onChange={(event) => setWorkerFilter(event.target.value)}
              >
                <option value="전체">전체 사용자</option>
                {data.workers.map((worker) => (
                  <option value={worker.key} key={worker.key}>
                    {profileMap.get(worker.key)?.representativeName ||
                      profileMap.get(worker.key)?.businessName ||
                      worker.name}
                  </option>
                ))}
              </select>
            )}
            <span className="dashboard-count">{data.latest.length}건</span>
          </div>
        </div>

        <div className="dashboard-latest-list">
          {data.latest.length === 0 ? (
            <div className="empty">저장된 작업이 없습니다.</div>
          ) : (
            data.latest.map((job) => (
              <article
                className="dashboard-job-card"
                key={job.id}
                onClick={() => onOpenJob(job)}
              >
                <div className="dashboard-job-main">
                  <div>
                    <span className="badge">{job.jobType}</span>
                    <strong>{job.address}</strong>
                    <small>
                      {job.workDate} · {job.worker || job.ownerEmail || "작업자 미입력"}
                    </small>
                  </div>
                  <strong>{formatWon(job.chargeAmount)}</strong>
                </div>

                <p>{job.workContent || "-"}</p>
                <span className="card-detail-hint">눌러서 자세히 보기 ›</span>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
