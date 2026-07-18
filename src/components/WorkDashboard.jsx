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

function jobWorkerKey(job) {
  return (
    job.assignedWorkerUid ||
    job.ownerUid ||
    job.assignedWorkerEmail ||
    job.ownerEmail ||
    job.worker ||
    "미지정"
  );
}

function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") {
    return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1000000);
  }
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function registrationMillis(job) {
  return (
    timestampMillis(job.createdAt) ||
    timestampMillis(job.updatedAt) ||
    new Date(`${job.workDate || "1970-01-01"}T${job.visitTime || "00:00"}:00`).getTime()
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
  const [todayWorkerFilter, setTodayWorkerFilter] = useState("전체");
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
      const key = jobWorkerKey(job);
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
            const owner = jobWorkerKey(job);
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
      .sort((a, b) => registrationMillis(b) - registrationMillis(a))
      .slice(0, 12);

    const selectedTodayJobs = todayJobs
      .filter((job) => {
        if (todayWorkerFilter === "전체") return true;
        const owner = jobWorkerKey(job);
        return owner === todayWorkerFilter;
      })
      .sort((a, b) =>
        String(a.visitTime || "00:00").localeCompare(
          String(b.visitTime || "00:00")
        )
      );

    return {
      todayJobs,
      monthJobs,
      todayAmount,
      monthAmount,
      workers: [...workers.values()].sort((a, b) => b.count - a.count),
      selectedTodayJobs,
      latest,
      upcomingFollowUps
    };
  }, [jobs, today, month, workerFilter, todayWorkerFilter]);

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
          label="오늘 매출"
          value={formatWon(data.todayAmount)}
        />
        <StatCard label="이번 달 작업" value={`${data.monthJobs.length}건`} />
        <StatCard
          label="이번 달 매출"
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
                  <button
                    type="button"
                    className={[
                      "worker-status-card",
                      todayWorkerFilter === worker.key ? "active" : ""
                    ].join(" ")}
                    key={worker.key}
                    onClick={() =>
                      setTodayWorkerFilter((current) =>
                        current === worker.key ? "전체" : worker.key
                      )
                    }
                  >
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
                  </button>
                );
              })
            )}
          </div>
        </section>
      )}

      {currentRole !== "기사" && todayWorkerFilter !== "전체" && (
        <section className="panel today-worker-jobs-panel">
          <div className="panel-title">
            <h2>선택 기사 오늘 작업</h2>
            <span className="dashboard-count">
              {data.selectedTodayJobs.length}건
            </span>
          </div>
          <div className="today-worker-job-list">
            {data.selectedTodayJobs.map((job) => (
              <button
                type="button"
                key={`${job.ownerUid || ""}-${job.id}`}
                onClick={() => onOpenJob(job)}
              >
                <strong>{job.visitTime || "시간 미입력"}</strong>
                <div>
                  <span>{job.address}</span>
                  <small>{job.jobType} · {job.worker || "담당기사 미입력"}</small>
                </div>
                <b>{formatWon(job.chargeAmount)}</b>
              </button>
            ))}
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
                {(profiles || [])
                  .filter((item) => item.uid)
                  .sort((a, b) =>
                    String(a.representativeName || a.email || "").localeCompare(
                      String(b.representativeName || b.email || ""),
                      "ko"
                    )
                  )
                  .map((item) => (
                    <option value={item.uid} key={item.uid}>
                      {item.representativeName || item.businessName || item.email}
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
                      {job.workDate} {job.visitTime || ""} · {profileMap.get(job.assignedWorkerUid || job.ownerUid)?.representativeName || job.worker || job.assignedWorkerEmail || job.ownerEmail || "담당기사 미입력"}
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
