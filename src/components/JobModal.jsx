import { useEffect, useMemo, useState } from "react";
import { formatWon } from "../utils/formatters";
import { calculateJobSettlement, getPaymentBreakdown, resolveSettlement } from "../utils/settlement";
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
  isSuperAdmin = false,
  canManageCollection = false,
  onMarkCollected,
  canManageSettlement = false,
  onSaveSettlement,
  onRequestReview,
  onMarkReviewGiftSent,
  reviewCompleted = false
}) {
  const paymentBreakdown = getPaymentBreakdown(job);
  const [workerRate, setWorkerRate] = useState(String(job.workerSettlementRate ?? 60));
  const [settlementSaving, setSettlementSaving] = useState(false);
  useEffect(() => setWorkerRate(String(job.workerSettlementRate ?? 60)), [job.id, job.workerSettlementRate]);
  const settlementPreview = useMemo(() => calculateJobSettlement(job, workerRate), [job, workerRate]);
  const savedSettlement = resolveSettlement(job);
  const reviewStatus = reviewCompleted
    ? (job.reviewGiftSentAt ? "gift-sent" : "completed")
    : (job.reviewRequestedAt ? "requested" : "none");


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
          <Detail label="방문시간" value={job.visitTime || "-"} />
          <Detail label="업체명" value={job.businessName || "-"} />
          <Detail label="대표자" value={job.representativeName || "-"} />
          <Detail label="연락처" value={job.phone || "-"} />
          <Detail label="담당기사" value={job.worker || "-"} />
          <Detail
            label="사용장비"
            value={job.equipment?.length ? job.equipment.join(", ") : "-"}
          />
          <Detail label="AS 기간" value={job.asPeriod || "-"} />
          <Detail label="작업금액" value={formatWon(job.chargeAmount)} />
          <Detail label="자재비" value={formatWon(job.materialCost)} />
          <Detail
            label="수수료"
            value={
              job.commissionType === "none"
                ? "없음"
                : job.commissionType === "fixed"
                  ? `${formatWon(job.commissionAmount)} · 금액입력`
                  : `${job.commissionRate || 0}% · ${formatWon(
                      job.commissionAmount
                    )}`
            }
          />
          <Detail label="실수령금액" value={formatWon(job.netAmount)} />
          <Detail
            label="수금상태"
            value={
              job.collectionStatus === "uncollected"
                ? "미수"
                : "수금완료"
            }
          />
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


        {(canManageSettlement || job.settlementStatus === "completed") && (
          <div className="job-settlement-manager">
            <div className="job-settlement-title">
              <div><strong>건별 기사·본사 정산</strong><span>{job.settlementStatus === "completed" ? "정산완료" : "정산대기"}</span></div>
              <span className={job.settlementStatus === "completed" ? "settlement-complete-chip" : "settlement-pending-chip"}>{job.settlementStatus === "completed" ? "완료" : "대기"}</span>
            </div>
            {canManageSettlement ? (
              <>
                <div className="settlement-rate-buttons">{[50,55,60,65,70,75,80].map((rate) => <button type="button" key={rate} className={Number(workerRate) === rate ? "active" : ""} onClick={() => setWorkerRate(String(rate))}>{rate}%</button>)}</div>
                <label className="settlement-rate-input"><span>기사 비율</span><div><input type="number" min="0" max="100" value={workerRate} onChange={(event) => setWorkerRate(event.target.value)} /><b>%</b></div></label>
                <div className="settlement-calculation-grid">
                  <Detail label="정산기준" value={formatWon(settlementPreview.settlementBaseAmount)} />
                  <Detail label="기사 비율" value={`${settlementPreview.workerSettlementRate}%`} />
                  <Detail label="본사 비율" value={`${settlementPreview.officeSettlementRate}%`} />
                  <Detail label="기사 정산금" value={formatWon(settlementPreview.workerSettlementAmount)} />
                  <Detail label="본사 정산금" value={formatWon(settlementPreview.officeSettlementAmount)} />
                </div>
                <small className="settlement-formula-note">정산기준 = 부가세 제외 원금 - 자재비 - 수수료</small>
                <button type="button" className="save-settlement-button" disabled={settlementSaving || workerRate === ""} onClick={async () => {
                  try {
                    setSettlementSaving(true);
                    await onSaveSettlement?.(job, settlementPreview);
                  } finally { setSettlementSaving(false); }
                }}>{settlementSaving ? "저장 중..." : "건별 정산 저장"}</button>
              </>
            ) : (
              <div className="settlement-calculation-grid">
                <Detail label="정산기준" value={formatWon(savedSettlement.settlementBaseAmount)} />
                <Detail label="기사 비율" value={`${savedSettlement.workerRate}%`} />
                <Detail label="본사 비율" value={`${savedSettlement.officeRate}%`} />
                <Detail label="기사 정산금" value={formatWon(savedSettlement.workerAmount)} />
                <Detail label="본사 정산금" value={formatWon(savedSettlement.officeAmount)} />
              </div>
            )}
          </div>
        )}

        <DetailBlock label="작업내용" value={job.workContent || "-"} />
        <DetailBlock label="작업결과" value={job.result || "-"} />
        <DetailBlock label="특이사항" value={job.memo || "-"} />
        {job.collectionMemo && (
          <DetailBlock label="미수 메모" value={job.collectionMemo} />
        )}

        {canManageCollection &&
          job.collectionStatus === "uncollected" && (
            <button
              type="button"
              className="mark-collected-detail-button"
              onClick={() => onMarkCollected?.(job)}
            >
              ✅ 수금완료 처리
            </button>
          )}

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

        <div className="review-request-panel">
          <div className="review-request-head">
            <strong>고객 후기 관리</strong>
            <span className={`review-status-chip ${reviewStatus}`}>
              {reviewStatus === "gift-sent"
                ? "🎁 사은품 전달완료"
                : reviewStatus === "completed"
                  ? "🟢 후기작성완료"
                  : reviewStatus === "requested"
                    ? "🟡 후기 요청완료"
                    : "⚪ 후기 미요청"}
            </span>
          </div>
          {job.reviewRequestedAt && (
            <small>요청일: {String(job.reviewRequestedAt).slice(0, 10)}</small>
          )}
          {reviewCompleted && !job.reviewGiftSentAt && (
            <button type="button" className="review-gift-button" onClick={() => onMarkReviewGiftSent?.(job)}>
              🎁 사은품 전달완료 처리
            </button>
          )}
          {!reviewCompleted && (
            <button
              type="button"
              className="review-request-button"
              disabled={!job.phone}
              onClick={() => onRequestReview?.(job)}
            >
              {job.reviewRequestedAt ? "📨 후기 재요청" : "📨 후기 요청 보내기"}
            </button>
          )}
          {!job.phone && <small>고객 연락처가 없어 후기 요청을 보낼 수 없습니다.</small>}
        </div>

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
