function csvCell(value) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

export function downloadMonthlyCsv(summary, month) {
  const rows = [
    ["월", month],
    ["작업 건수", summary.jobCount],
    ["총 청구금액", summary.totalCharge],
    ["현금", summary.cash],
    ["계좌입금", summary.transfer],
    ["카드", summary.card],
    ["계산서 발행", summary.invoice],
    ["결제 합계", summary.totalPaid],
    ["차이", summary.difference],
    [],
    ["작업일", "작업자", "작업종류", "주소", "청구금액", "현금", "계좌입금", "카드", "계산서", "차이"]
  ];

  for (const job of summary.jobs) {
    rows.push([
      job.workDate || "",
      job.worker || job.ownerEmail || "",
      job.jobType || "",
      job.address || "",
      job.chargeAmount || 0,
      job.paymentBreakdownResolved?.cash || 0,
      job.paymentBreakdownResolved?.transfer || 0,
      job.paymentBreakdownResolved?.card || 0,
      job.paymentBreakdownResolved?.invoice || 0,
      job.paymentDifferenceResolved || 0
    ]);
  }

  const csv = "\ufeff" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `GW_ONE_${month}_월정산.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
