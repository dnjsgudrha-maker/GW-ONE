import { formatWon } from "../utils/formatters";
import {
  formatDate,
  getAsStatus
} from "../utils/customers";

export default function CustomerModal({ customer, onClose, onOpenJob }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal-card customer-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span className="badge">고객 이력</span>
            <h2>{customer.phone || "연락처 없음"}</h2>
            <p className="modal-company">{customer.address || "-"}</p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="customer-summary-grid">
          <div>
            <span>방문 횟수</span>
            <strong>{customer.jobs.length}회</strong>
          </div>
          <div>
            <span>누적 청구</span>
            <strong>{formatWon(customer.totalCharge)}</strong>
          </div>
        </div>

        <div className="history-list">
          {customer.jobs.map((job) => {
            const asStatus = getAsStatus(job.workDate, job.asPeriod);

            return (
              <article
                className="history-card"
                key={job.id}
                onClick={() => onOpenJob(job)}
              >
                <div className="history-head">
                  <strong>{job.workDate}</strong>
                  <span className="badge">{job.jobType}</span>
                </div>

                <p>{job.workContent || "-"}</p>

                <div className="history-bottom">
                  <span>{formatWon(job.chargeAmount)}</span>
                  <span className={asStatus.active ? "as-active" : "as-inactive"}>
                    {asStatus.expiry
                      ? `${asStatus.label} · 만료 ${formatDate(asStatus.expiry)}`
                      : asStatus.label}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
