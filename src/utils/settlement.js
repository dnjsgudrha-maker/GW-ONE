export function numberValue(value) {
  return Number(String(value || "").replace(/,/g, "")) || 0;
}

export function getPaymentBreakdown(job) {
  if (job?.paymentBreakdown) {
    return {
      cash: numberValue(job.paymentBreakdown.cash),
      transfer: numberValue(job.paymentBreakdown.transfer),
      card: numberValue(job.paymentBreakdown.card),
      invoice: numberValue(job.paymentBreakdown.invoice)
    };
  }

  const amount = numberValue(job?.chargeAmount);
  const method = job?.paymentMethod || "계좌입금";
  return {
    cash: method === "현금" ? amount : 0,
    transfer: method === "계좌입금" ? amount : 0,
    card: method === "카드" ? amount : 0,
    invoice: method === "계산서 발행" ? amount : 0
  };
}

export function resolveFinancials(job) {
  const chargeAmount = numberValue(job?.chargeAmount);
  // baseChargeAmount는 카드·세금계산서의 부가세 10%를 제외한 원금입니다.
  const baseChargeAmount = numberValue(job?.baseChargeAmount) || chargeAmount;
  const materialCost = numberValue(job?.materialCost);
  const commissionBaseAmount = Math.max(baseChargeAmount - materialCost, 0);
  const commissionType = job?.commissionType || "percent";
  const commissionRate = numberValue(job?.commissionRate);
  const commissionFixedAmount = numberValue(job?.commissionFixedAmount);
  const savedCommissionAmount = numberValue(job?.commissionAmount);
  const commissionAmount =
    commissionType === "none"
      ? 0
      : savedCommissionAmount > 0
        ? savedCommissionAmount
        : commissionType === "fixed"
          ? commissionFixedAmount
          : Math.round((commissionBaseAmount * commissionRate) / 100);
  // 기사·본사 비율은 반드시 원금 - 자재비 - 수수료 이후 금액에서 나눕니다.
  const netAmount = Math.max(baseChargeAmount - materialCost - commissionAmount, 0);

  return {
    chargeAmount,
    baseChargeAmount,
    materialCost,
    commissionBaseAmount,
    commissionType,
    commissionRate,
    commissionAmount,
    netAmount
  };
}

// v6.0 운영버전에서는 기사·본사 비율(6:4 포함)을 계산하거나 저장하지 않습니다.
// 수수료와 자재비 계산은 작업보고서 및 수금 확인을 위해서만 유지합니다.
