import { formatWon } from "../utils/formatters";
import { getPaymentBreakdown } from "../utils/settlement";
import { shareJob } from "../utils/share";

function Detail({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DetailBlock({ label, value }) {
  return (
    <div className="detail-block">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

function PhotoSection({ title, urls }) {
  if (!urls.length) return null;

  return (
    <div className="detail-block">
      <span>{title}</span>
      <div className="modal-photos">
        {urls.map((url) => (
          <a href={url} target="_blank" rel="noreferrer" key={url}>
            <img src={url} alt={title} />
          </a>
        ))}
      </div>
    </div>
  );
}

export default function JobModal({
  job,
  onClose,
  onDelete,
  onNotice,
  onOpenDocument,
  onEdit,
  onCopy,
  canEdit = true,
  canDelete = true,
  isSuperAdmin = false
}) {
  const paymentBreakdown = getPaymentBreakdown(job);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="badge">{job.jobType}</span>
            <h2>{job.address}</h2>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="detail-grid">
          <Detail label="작업일" value={job.workDate} />
          <Detail label="업체명" value={job.businessName || "-"} />
          <Detail label="대표자" value={job.representativeName || "-"} />
          <Detail label="연락처" value={job.phone || "-"} />
          <Detail label="작업자" value={job.worker || "-"} />
          <Detail
            label="사용장비"
            value={job.equipment?.length ? job.equipment.join(", ") : "-"}
          />
          <Detail label="AS 기간" value={job.asPeriod || "-"} />
          <Detail label="작업금액" value={formatWon(job.chargeAmount)} />
          <Detail label="자재비" value={formatWon(job.materialCost)} />
          <Detail
            label="결제내역"
            value={[
              paymentBreakdown.cash > 0 ? `현금 ${formatWon(paymentBreakdown.cash)}` : "",
              paymentBreakdown.transfer > 0 ? `계좌입금 ${formatWon(paymentBreakdown.transfer)}` : "",
              paymentBreakdown.card > 0 ? `카드 ${formatWon(paymentBreakdown.card)}` : "",
              paymentBreakdown.invoice > 0 ? `계산서 ${formatWon(paymentBreakdown.invoice)}` : ""
            ].filter(Boolean).join(" / ") || "-"}
          />
        </div>

        <DetailBlock label="작업내용" value={job.workContent || "-"} />
        <DetailBlock label="작업결과" value={job.result || "-"} />
        <DetailBlock label="특이사항" value={job.memo || "-"} />

        {job.followUpDate && (
          <DetailBlock
            label={`${job.followUpType || "재방문"} 예정`}
            value={`${job.followUpDate}${
              job.followUpMemo ? ` · ${job.followUpMemo}` : ""
            }`}
          />
        )}

        {job.leakOpinion && (
          <DetailBlock label="누수 소견서 초안" value={job.leakOpinion} />
        )}

        <PhotoSection title="작업 전" urls={job.beforePhotoUrls || []} />
        <PhotoSection title="작업 중" urls={job.duringPhotoUrls || []} />
        <PhotoSection title="작업 후" urls={job.afterPhotoUrls || []} />

        <div className="quick-action-buttons">
          <button
            type="button"
            disabled={!job.phone}
            onClick={() => {
              if (job.phone) window.location.href = `tel:${job.phone}`;
            }}
          >
            📞 전화
          </button>
          <button
            type="button"
            disabled={!job.address}
            onClick={() =>
              window.open(
                `https://map.tmap.co.kr/route?goalname=${encodeURIComponent(
                  job.address
                )}`,
                "_blank"
              )
            }
          >
            🧭 티맵
          </button>
          <button type="button" onClick={onCopy}>
            📋 이전 작업 복사
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const message = await shareJob(job);
                onNotice(message);
              } catch (error) {
                onNotice(`공유하지 못했습니다: ${error.message}`);
              }
            }}
          >
            📤 작업내용 공유
          </button>
        </div>

        <div className="document-buttons">
          <button type="button" onClick={() => onOpenDocument("report")}>
            📄 작업보고서
          </button>
          <button type="button" onClick={() => onOpenDocument("opinion")}>
            📑 소견서
          </button>
          <button type="button" onClick={() => onOpenDocument("receipt")}>
            🧾 영수증
          </button>
          <button
            type="button"
            className="package-button"
            onClick={() => onOpenDocument("package")}
          >
            📦 제출 패키지
          </button>
        </div>

        {canEdit && (
          <button className="edit-button" onClick={onEdit}>
            ✏️ {isSuperAdmin ? "작업일지 수정(최고관리자)" : "작업일지 수정"}
          </button>
        )}

        {canDelete && (
          <button className="delete-button" onClick={onDelete}>
            {isSuperAdmin ? "작업일지 삭제(최고관리자)" : "작업일지 삭제"}
          </button>
        )}
      </section>
    </div>
  );
}
