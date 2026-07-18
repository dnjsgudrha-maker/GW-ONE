import { normalizeMediaUrl, optimizedPhotoUrl } from "../utils/cloudinary";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { formatWon } from "../utils/formatters";
import { resolveFinancials } from "../utils/settlement";

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
        <span>{job.businessName || "(주)지더블유솔루션"}</span>
        {!job.hideRepresentative && (
          <span>대표자 {job.representativeName || "-"}</span>
        )}
        <span>사업자등록번호 {job.businessNumber || "-"}</span>
        <span>담당기사 {job.worker || "-"}</span>
      </div>
    </>
  );
}

function PhotoGroup({ title, urls = [] }) {
  const normalizedUrls = urls.map(normalizeMediaUrl).filter(Boolean);
  if (!normalizedUrls.length) return null;

  return (
    <section className="doc-section doc-photo-section">
      <h3>{title}</h3>
      <div className="doc-photo-grid">
        {normalizedUrls.map((url, index) => (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            key={`${title}-${url}-${index}`}
          >
            <img src={optimizedPhotoUrl(url, 1400)} alt={`${title} ${index + 1}`} />
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
  const financials = resolveFinancials(job);
  const commissionLabel =
    financials.commissionType === "none"
      ? "없음"
      : financials.commissionType === "fixed"
        ? `${formatWon(financials.commissionAmount)} (금액입력)`
        : `${financials.commissionRate || 0}% · ${formatWon(financials.commissionAmount)}`;

  return (
    <article className="print-document" data-document-title="작업보고서">
      <DocumentHeader title="작 업 보 고 서" job={job} />

      <section className="doc-section">
        <h3>기본 정보</h3>
        <InfoRow label="작업일" value={job.workDate} />
        <InfoRow label="방문시간" value={job.visitTime || "-"} />
        <InfoRow label="현장주소" value={job.address} />
        <InfoRow label="연락처" value={job.phone} />
        <InfoRow label="작업종류" value={job.jobType} />
        <InfoRow label="담당기사" value={job.worker} />
        <InfoRow
          label="사용장비"
          value={job.equipment?.length ? job.equipment.join(", ") : "-"}
        />
      </section>

      <section className="doc-section">
        <h3>금액 내역</h3>
        <InfoRow
          label="총 작업금액 (부가세 미포함)"
          value={formatWon(financials.baseChargeAmount)}
        />
        <InfoRow label="자재비" value={formatWon(financials.materialCost)} />
        <InfoRow label="수수료" value={commissionLabel} />
        <InfoRow
          label="정산 대상금액"
          value={formatWon(financials.netAmount)}
        />
        <p className="doc-finance-note">
          정산 대상금액 = 부가세 미포함 작업금액 - 자재비 - 수수료
        </p>
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
    <article className="print-document" data-document-title="소견서">
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
        <InfoRow label="방문시간" value={job.visitTime || "-"} />
        <InfoRow label="현장주소" value={job.address} />
        <InfoRow label="담당기사" value={job.worker} />
      </section>

      <DocumentPhotos job={job} />
      <DocumentFooter job={job} />
    </article>
  );
}

function Receipt({ job }) {
  return (
    <article className="print-document receipt-document" data-document-title="영수증">
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
        <strong>{job.businessName || "(주)지더블유솔루션"}</strong>
        {!job.hideRepresentative && (
          <span>대표자 {job.representativeName || "-"}</span>
        )}
        <span>사업자등록번호 {job.businessNumber || "-"}</span>
        <span>담당기사 {job.worker || "-"}</span>
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


function safeFileName(value) {
  return String(value || "문서")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_");
}

function compactDate(value) {
  return String(value || new Date().toISOString().slice(0, 10))
    .replace(/\D/g, "")
    .slice(0, 8);
}

function sequenceText(value) {
  return String(Math.max(1, Number(value || 1))).padStart(3, "0");
}

function documentFileName(job, title, extension) {
  return [
    compactDate(job.workDate),
    safeFileName(job.worker || job.representativeName || "작업자"),
    sequenceText(job.dailySequence),
    safeFileName(title)
  ].join("_") + `.${extension}`;
}

async function waitForImages(element) {
  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map((image) => {
      if (image.complete) return Promise.resolve();

      return new Promise((resolve) => {
        image.onload = resolve;
        image.onerror = resolve;
      });
    })
  );
}

async function elementToCanvas(element) {
  await waitForImages(element);

  return html2canvas(element, {
    scale: Math.min(window.devicePixelRatio || 2, 2.5),
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });
}

function downloadCanvas(canvas, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png", 1);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function saveCanvasAsPdf(canvas, filename) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 8;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  const imageWidth = usableWidth;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  const pagePixelHeight = Math.max(
    1,
    Math.floor((usableHeight / imageHeight) * canvas.height)
  );

  let offsetY = 0;
  let pageIndex = 0;

  while (offsetY < canvas.height) {
    const sliceHeight = Math.min(pagePixelHeight, canvas.height - offsetY);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHeight;

    const context = slice.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, slice.width, slice.height);
    context.drawImage(
      canvas,
      0,
      offsetY,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );

    const sliceHeightMm = (sliceHeight * imageWidth) / canvas.width;

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(
      slice.toDataURL("image/jpeg", 0.92),
      "JPEG",
      margin,
      margin,
      imageWidth,
      Math.min(sliceHeightMm, usableHeight),
      undefined,
      "FAST"
    );

    offsetY += sliceHeight;
    pageIndex += 1;
  }

  pdf.save(filename);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function DocumentModal({ type, job, onClose }) {
  const captureRef = useRef(null);
  const [savingMode, setSavingMode] = useState("");

  const titles = {
    report: "작업보고서",
    opinion: "소견서",
    receipt: "영수증",
    package: "전체 문서"
  };

  const getTargets = () => {
    if (!captureRef.current) return [];

    return Array.from(
      captureRef.current.querySelectorAll(".print-document")
    ).map((element) => ({
      element,
      title: element.dataset.documentTitle || "문서"
    }));
  };

  const saveDocuments = async (format) => {
    if (savingMode) return;

    const targets = getTargets();
    if (!targets.length) return;

    setSavingMode(format);

    try {
      for (let index = 0; index < targets.length; index += 1) {
        const { element, title } = targets[index];
        const canvas = await elementToCanvas(element);
        const filename = documentFileName(
          job,
          title,
          format === "pdf" ? "pdf" : "png"
        );

        if (format === "pdf") {
          saveCanvasAsPdf(canvas, filename);
        } else {
          downloadCanvas(canvas, filename);
        }

        if (index < targets.length - 1) {
          await sleep(450);
        }
      }
    } catch (error) {
      window.alert(
        `문서 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.\n${error.message}`
      );
    } finally {
      setSavingMode("");
    }
  };

  const isPackage = type === "package";

  return (
    <div className="document-modal-backdrop">
      <section className="document-modal-card">
        <div className="document-modal-toolbar no-print">
          <strong>{titles[type]}</strong>
          <div>
            <button
              onClick={() => saveDocuments("pdf")}
              disabled={Boolean(savingMode)}
            >
              {savingMode === "pdf"
                ? "PDF 만드는 중..."
                : isPackage
                  ? "📄 PDF 전체 저장"
                  : "📄 PDF 저장"}
            </button>
            <button
              onClick={() => saveDocuments("png")}
              disabled={Boolean(savingMode)}
            >
              {savingMode === "png"
                ? "이미지 만드는 중..."
                : isPackage
                  ? "🖼 이미지 전체 저장"
                  : "🖼 이미지 저장"}
            </button>
            <button onClick={onClose}>닫기</button>
          </div>
        </div>

        <div className="document-preview" ref={captureRef}>
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
