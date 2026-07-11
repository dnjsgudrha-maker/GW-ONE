import { formatWon } from "../utils/formatters";
import { buildCustomerGroups, getAsStatus } from "../utils/customers";

export default function CustomerList({
  jobs,
  search,
  setSearch,
  onSelect
}) {
  const groups = buildCustomerGroups(jobs);
  const keyword = search.trim().toLowerCase();

  const filtered = keyword
    ? groups.filter((customer) =>
        [
          customer.phone,
          customer.address,
          customer.latestJob?.jobType,
          customer.latestJob?.worker
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword)
      )
    : groups;

  return (
    <section className="panel">
      <div className="panel-title">
        <h2>고객관리</h2>
        <span className="customer-count">{groups.length}명</span>
      </div>

      <input
        className="search"
        placeholder="전화번호, 주소, 작업종류 검색"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="customer-list">
        {filtered.length === 0 ? (
          <div className="empty">등록된 고객 이력이 없습니다.</div>
        ) : (
          filtered.map((customer) => {
            const latest = customer.latestJob;
            const asStatus = getAsStatus(latest?.workDate, latest?.asPeriod);

            return (
              <article
                key={customer.key}
                className="customer-card"
                onClick={() => onSelect(customer)}
              >
                <div className="customer-card-head">
                  <div>
                    <strong>{customer.phone || "연락처 없음"}</strong>
                    <span>{customer.address || "주소 없음"}</span>
                  </div>
                  <span className="visit-badge">{customer.jobs.length}회 방문</span>
                </div>

                <div className="customer-latest">
                  <span>최근 작업</span>
                  <strong>
                    {latest?.workDate || "-"} · {latest?.jobType || "-"}
                  </strong>
                </div>

                <div className="customer-meta">
                  <span>누적 {formatWon(customer.totalCharge)}</span>
                  <span className={asStatus.active ? "as-active" : "as-inactive"}>
                    {asStatus.label}
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
