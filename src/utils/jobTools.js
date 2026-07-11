function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function filterJobs(jobs, filters = {}) {
  const {
    keyword = "",
    startDate = "",
    endDate = "",
    worker = "전체",
    jobType = "전체",
    payment = "전체"
  } = filters;

  const keywordValue = normalize(keyword);

  return jobs.filter((job) => {
    if (startDate && String(job.workDate || "") < startDate) return false;
    if (endDate && String(job.workDate || "") > endDate) return false;

    if (
      worker !== "전체" &&
      ![
        job.worker,
        job.ownerEmail,
        job.representativeName,
        job.businessName
      ]
        .filter(Boolean)
        .includes(worker)
    ) {
      return false;
    }

    if (jobType !== "전체" && job.jobType !== jobType) return false;

    if (payment !== "전체") {
      const breakdown = job.paymentBreakdown || {};
      const hasPayment =
        payment === "현금"
          ? Number(breakdown.cash || 0) > 0 || job.paymentMethod === "현금"
          : payment === "계좌입금"
          ? Number(breakdown.transfer || 0) > 0 ||
            job.paymentMethod === "계좌입금"
          : payment === "카드"
          ? Number(breakdown.card || 0) > 0 || job.paymentMethod === "카드"
          : payment === "계산서 발행"
          ? Number(breakdown.invoice || 0) > 0 ||
            job.paymentMethod === "계산서 발행"
          : true;

      if (!hasPayment) return false;
    }

    if (!keywordValue) return true;

    return [
      job.workDate,
      job.phone,
      job.address,
      job.jobType,
      job.worker,
      job.workContent,
      job.result,
      job.memo,
      job.businessName,
      job.representativeName,
      job.paymentMethod,
      ...(job.equipment || [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(keywordValue);
  });
}

function csvCell(value) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

export function downloadJobsCsv(jobs, filename = "GW_ONE_작업목록.csv") {
  const rows = [
    [
      "작업일",
      "작업자",
      "작업종류",
      "주소",
      "연락처",
      "청구금액",
      "현금",
      "계좌입금",
      "카드",
      "계산서",
      "작업내용",
      "작업결과",
      "AS 기간"
    ]
  ];

  for (const job of jobs) {
    const payment = job.paymentBreakdown || {};

    rows.push([
      job.workDate || "",
      job.worker || job.ownerEmail || "",
      job.jobType || "",
      job.address || "",
      job.phone || "",
      job.chargeAmount || 0,
      payment.cash || (job.paymentMethod === "현금" ? job.chargeAmount || 0 : 0),
      payment.transfer ||
        (job.paymentMethod === "계좌입금" ? job.chargeAmount || 0 : 0),
      payment.card || (job.paymentMethod === "카드" ? job.chargeAmount || 0 : 0),
      payment.invoice ||
        (job.paymentMethod === "계산서 발행" ? job.chargeAmount || 0 : 0),
      job.workContent || "",
      job.result || "",
      job.asPeriod || ""
    ]);
  }

  const csv =
    "\ufeff" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
