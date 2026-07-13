import { formatWon } from "../utils/formatters";

function InfoRow({ label, value }) {
  return (
    <div className="doc-row">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

function DocumentHeader({ title, job }) {
  return (
    <>
      <div className="doc-title">{title}</div>
      <div className="doc-subtitle">
        {job.businessName || "업체명"} · 대표 {job.representativeName || "-"}
        {job.businessNumber ? ` · ${job.businessNumber}` : ""}
        {job.businessContact ? ` · ${job.businessContact}` : ""}
      </div>
    </>
  );
}

function PhotoGroup({ title, urls = [] }) {
  if (!urls.length) return null;

  return (
    <section className="doc-section doc-photo-section">
      <h3>{title}</h3>
      <div className="doc-photo-grid">
        {urls.map((url, index) => (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            key={`${title}-${url}-${index}`}
          >
            <img src={url} alt={`${title} ${index + 1}`} />
            <span>{index + 1}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function DocumentPhotos({ job }) {
  const before = job.beforePhotoUrls || [];
  const during = job.duringPhotoUrls || [];
  const after = job.afterPhotoUrls || [];

  if (!before.length && !during.length && !after.length) {
    return null;
  }

  return (
    <section className="document-photo-block">
      <h2>현장 사진</h2>
      <PhotoGroup title="작업 전" urls={before} />
      <PhotoGroup title="작업 중" urls={during} />
      <PhotoGroup title="작업 후" urls={after} />
    </section>
  );
}

function WorkReport({ job }) {
  return (
    <article className="print-document">
      <DocumentHeader title="작 업 보 고 서" job={job} />

      <section className="doc-section">
        <h3>기본 정보</h3>
        <InfoRow label="작업일" value={job.workDate} />
        <InfoRow label="현장주소" value={job.address} />
        <InfoRow label="연락처" value={job.phone} />
        <InfoRow label="작업종류" value={job.jobType} />
        <InfoRow label="작업자" value={job.worker} />
        <InfoRow
          label="사용장비"
          value={job.equipment?.length ? job.equipment.join(", ") : "-"}
        />
      </section>

      <section className="doc-section">
        <h3>작업 내용</h3>
        <p>{job.workContent || "-"}</p>
      </section>

      <section className="doc-section">
        <h3>작업 결과</h3>
        <p>{job.result || "-"}</p>
      </section>

      <section className="doc-section">
        <h3>특이사항</h3>
        <p>{job.memo || "-"}</p>
      </section>

      <section className="doc-section">
        <h3>보증 안내</h3>
        <InfoRow label="A/S 기간" value={job.asPeriod || "없음"} />
      </section>

      <DocumentPhotos job={job} />
      <DocumentFooter job={job} />
    </article>
  );
}

function Opinion({ job }) {
  return (
    <article className="print-document">
      <DocumentHeader title="소 견 서" job={job} />

      <section className="doc-section opinion-body">
        <h3>현장 확인 및 작업 소견</h3>
        <p className="opinion-prewrap">
          {job.leakOpinion ||
            `${job.address || "해당 현장"}에 방문하여 ${
              job.jobType || "설비 관련"
            } 점검을 진행했습니다.\n\n${
              job.workContent || "현장 상태를 확인하고 필요한 조치를 진행했습니다."
            }\n\n작업 후 확인 결과 ${
              job.result || "추가 이상 없이 정상 상태를 확인했습니다."
            }\n\n상기 내용은 현장 확인과 실제 작업 내용을 기준으로 작성했습니다.`}
        </p>
      </section>

      <section className="doc-section">
        <InfoRow label="작성일" value={job.workDate} />
        <InfoRow label="현장주소" value={job.address} />
        <InfoRow label="작업자" value={job.worker} />
      </section>

      <DocumentPhotos job={job} />
      <DocumentFooter job={job} />
    </article>
  );
}

function Receipt({ job }) {
  return (
    <article className="print-document receipt-document">
      <DocumentHeader title="영 수 증" job={job} />

      <section className="doc-section">
        <InfoRow label="발행일" value={job.workDate} />
        <InfoRow label="현장주소" value={job.address} />
        <InfoRow label="작업내용" value={job.jobType} />
        <InfoRow label="결제방식" value={job.paymentMethod} />
      </section>

      <section className="receipt-total">
        <span>영수금액</span>
        <strong>{formatWon(job.chargeAmount)}</strong>
      </section>

      <section className="doc-section">
        <p className="receipt-note">
          위 금액을 정상적으로 영수했습니다.
        </p>
      </section>

      <DocumentFooter job={job} />
    </article>
  );
}

function DocumentFooter({ job }) {
  return (
    <footer className="doc-footer">
      <div>
        <strong>{job.businessName || "업체명"}</strong>
        <span>대표 {job.representativeName || "-"}</span>
        {job.businessNumber && (
          <span>사업자등록번호 {job.businessNumber}</span>
        )}
        {job.businessContact && <span>{job.businessContact}</span>}
        {job.businessEmail && <span>{job.businessEmail}</span>}
        {job.businessAddress && <span>{job.businessAddress}</span>}
      </div>
      <div className="doc-stamp">
        {job.stampDataUrl || job.stampUrl ? (
          <img src={job.stampDataUrl || job.stampUrl} alt="직인" />
        ) : (
          <span>직인</span>
        )}
      </div>
    </footer>
  );
}

export default function DocumentModal({ type, job, onClose }) {
  const titles = {
    report: "작업보고서",
    opinion: "소견서",
    receipt: "영수증",
    package: "현장 제출 패키지"
  };

  return (
    <div className="document-modal-backdrop">
      <section className="document-modal-card">
        <div className="document-modal-toolbar no-print">
          <strong>{titles[type]}</strong>
          <div>
            <button onClick={() => window.print()}>🖨 인쇄 / PDF 저장</button>
            <button onClick={onClose}>닫기</button>
          </div>
        </div>

        <div className="document-preview">
          {type === "report" && <WorkReport job={job} />}
          {type === "opinion" && <Opinion job={job} />}
          {type === "receipt" && <Receipt job={job} />}
          {type === "package" && (
            <>
              <WorkReport job={job} />
              <Opinion job={job} />
              <Receipt job={job} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
