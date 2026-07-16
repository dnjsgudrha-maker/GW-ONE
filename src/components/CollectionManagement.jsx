import { useMemo, useState } from "react";
import { formatWon } from "../utils/formatters";

function completedDate(value) {
  if (!value) return "-";
  if (typeof value?.toDate === "function") {
    return value.toDate().toLocaleString("ko-KR");
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("ko-KR");
}

export default function CollectionManagement({
  jobs,
  onOpenJob,
  onMarkCollected
}) {
  const [filter, setFilter] = useState("uncollected");
  const [search, setSearch] = useState("");

  const summary = useMemo(() => {
    const uncollected = (jobs || []).filter(
      (job) => job.collectionStatus === "uncollected"
    );

    return {
      count: uncollected.length,
      amount: uncollected.reduce(
        (sum, job) => sum + Number(job.chargeAmount || 0),
        0
      )
    };
  }, [jobs]);

  const visible = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return [...(jobs || [])]
      .filter((job) => {
        const status = job.collectionStatus || "collected";

        if (filter !== "all" && status !== filter) return false;
        if (!keyword) return true;

        return [
          job.address,
          job.phone,
          job.worker,
          job.jobType,
          job.collectionMemo
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      })
      .sort((a, b) =>
        String(b.workDate || "").localeCompare(String(a.workDate || ""))
      );
  }, [jobs, filter, search]);

  return (
    <section className="panel collection-page">
      <div className="panel-title">
        <div>
          <h2>수금관리</h2>
          <p>미수와 실제 수금완료 상태를 관리합니다.</p>
        </div>
      </div>

      <div className="collection-summary">
        <div>
          <span>미수 건수</span>
          <strong>{summary.count}건</strong>
        </div>
        <div>
          <span>총 미수금</span>
          <strong>{formatWon(summary.amount)}</strong>
        </div>
      </div>

      <div className="collection-toolbar">
        <div className="collection-filter-buttons">
          <button
            className={filter === "uncollected" ? "active" : ""}
            onClick={() => setFilter("uncollected")}
          >
            미수
          </button>
          <button
            className={filter === "collected" ? "active" : ""}
            onClick={() => setFilter("collected")}
          >
            수금완료
          </button>
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            전체
          </button>
        </div>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="주소·전화번호·작업자 검색"
        />
      </div>

      <div className="collection-list">
        {visible.length === 0 ? (
          <div className="empty">해당하는 작업이 없습니다.</div>
        ) : (
          visible.map((job) => {
            const isUncollected =
              job.collectionStatus === "uncollected";

            return (
              <article
                className="collection-card"
                key={`${job.ownerUid || ""}-${job.id}`}
              >
                <button
                  type="button"
                  className="collection-card-main"
                  onClick={() => onOpenJob(job)}
                >
                  <div>
                    <strong>{job.workDate} · {job.jobType}</strong>
                    <span>{job.address}</span>
                    <small>{job.worker || "작업자 미입력"}</small>
                  </div>
                  <strong>{formatWon(job.chargeAmount)}</strong>
                </button>

                <div className="collection-card-footer">
                  <span className={isUncollected ? "uncollected" : "collected"}>
                    {isUncollected ? "🟡 미수" : "🟢 수금완료"}
                  </span>

                  {isUncollected ? (
                    <button
                      type="button"
                      className="mark-collected-button"
                      onClick={() => onMarkCollected(job)}
                    >
                      수금완료 처리
                    </button>
                  ) : (
                    <small>
                      완료일 {completedDate(job.collectionCompletedAt)}
                    </small>
                  )}
                </div>

                {job.collectionMemo && (
                  <p className="collection-memo">{job.collectionMemo}</p>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
