import { useMemo, useState } from "react";
import { JOB_TYPES } from "../constants";
import { formatWon } from "../utils/formatters";
import { downloadJobsCsv, filterJobs } from "../utils/jobTools";

export default function JobList({
  jobs,
  totalCount,
  monthCount,
  search,
  setSearch,
  onCreate,
  onSelect
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [worker, setWorker] = useState("전체");
  const [jobType, setJobType] = useState("전체");
  const [payment, setPayment] = useState("전체");

  const workers = useMemo(
    () =>
      [
        ...new Set(
          jobs
            .map(
              (job) =>
                job.worker ||
                job.representativeName ||
                job.ownerEmail ||
                ""
            )
            .filter(Boolean)
        )
      ].sort((a, b) => a.localeCompare(b, "ko")),
    [jobs]
  );

  const filteredJobs = useMemo(
    () =>
      filterJobs(jobs, {
        keyword: search,
        startDate,
        endDate,
        worker,
        jobType,
        payment
      }),
    [jobs, search, startDate, endDate, worker, jobType, payment]
  );

  const resetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setWorker("전체");
    setJobType("전체");
    setPayment("전체");
  };

  return (
    <>
      <section className="summary">
        <div>
          <span>전체 작업</span>
          <strong>{totalCount}건</strong>
        </div>
        <div>
          <span>이번 달</span>
          <strong>{monthCount}건</strong>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>작업목록</h2>
          <button className="primary small" onClick={onCreate}>
            + 작업입력
          </button>
        </div>

        <div className="job-search-row">
          <input
            className="search"
            placeholder="주소, 연락처, 작업내용 검색"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            type="button"
            className="filter-toggle-button"
            onClick={() => setFiltersOpen((current) => !current)}
          >
            {filtersOpen ? "필터 닫기" : "상세 필터"}
          </button>
        </div>

        {filtersOpen && (
          <div className="job-filter-panel">
            <label>
              <span>시작일</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>

            <label>
              <span>종료일</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>

            <label>
              <span>작업자</span>
              <select value={worker} onChange={(event) => setWorker(event.target.value)}>
                <option value="전체">전체</option>
                {workers.map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>작업종류</span>
              <select
                value={jobType}
                onChange={(event) => setJobType(event.target.value)}
              >
                <option value="전체">전체</option>
                {JOB_TYPES.map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>결제방식</span>
              <select
                value={payment}
                onChange={(event) => setPayment(event.target.value)}
              >
                <option value="전체">전체</option>
                <option value="현금">현금</option>
                <option value="계좌입금">계좌입금</option>
                <option value="카드">카드</option>
                <option value="계산서 발행">계산서 발행</option>
              </select>
            </label>

            <div className="job-filter-actions">
              <button type="button" onClick={resetFilters}>
                초기화
              </button>
              <button
                type="button"
                className="csv-button"
                onClick={() =>
                  downloadJobsCsv(
                    filteredJobs,
                    `GW_ONE_작업목록_${new Date()
                      .toISOString()
                      .slice(0, 10)}.csv`
                  )
                }
                disabled={!filteredJobs.length}
              >
                현재 목록 CSV
              </button>
            </div>
          </div>
        )}

        <div className="filtered-count">
          검색 결과 <strong>{filteredJobs.length}건</strong>
        </div>

        <div className="job-list">
          {filteredJobs.length === 0 ? (
            <div className="empty">조건에 맞는 작업일지가 없습니다.</div>
          ) : (
            filteredJobs.map((job) => (
              <article
                className="job-card"
                key={`${job.ownerUid || "self"}-${job.id}`}
                onClick={() => onSelect(job)}
              >
                <div className="job-card-head">
                  <span className="badge">{job.jobType}</span>
                  <time>{job.workDate}</time>
                </div>

                <h3>{job.address}</h3>
                <p>
                  {job.businessName || "업체 미등록"} ·{" "}
                  {job.worker || job.ownerEmail || "작업자 미입력"}
                </p>
                <p className="job-content">{job.workContent}</p>

                <div className="money-line">
                  <strong>{formatWon(job.chargeAmount || 0)}</strong>
                  <span>
                    실수령 {formatWon(job.netAmount || 0)}
                  </span>
                </div>

                <span className="card-detail-hint">눌러서 자세히 보기 ›</span>

                {job.equipment?.length > 0 && (
                  <div className="tag-row">
                    {job.equipment.slice(0, 4).map((item) => (
                      <span className="mini-tag" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}
