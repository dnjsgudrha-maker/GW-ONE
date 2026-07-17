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

export function resolveSettlement(job) {
  const financials = resolveFinancials(job);
  const settlementBaseAmount = financials.netAmount;
  const workerRate = Math.min(100, Math.max(0, numberValue(job?.workerSettlementRate)));
  const officeRate = 100 - workerRate;
  const isCompleted = job?.settlementStatus === "completed";
  // 기존에 잘못 저장된 정산금이 있더라도 최신 공식으로 즉시 다시 계산합니다.
  const workerAmount = isCompleted
    ? Math.round((settlementBaseAmount * workerRate) / 100)
    : 0;
  const officeAmount = isCompleted ? settlementBaseAmount - workerAmount : 0;

  return {
    ...financials,
    settlementBaseAmount,
    workerRate,
    officeRate,
    workerAmount,
    officeAmount,
    settlementStatus: job?.settlementStatus || "pending"
  };
}

export function calculateJobSettlement(job, workerRateInput) {
  const base = resolveSettlement(job);
  const workerRate = Math.min(100, Math.max(0, numberValue(workerRateInput)));
  const officeRate = 100 - workerRate;
  const workerAmount = Math.round((base.settlementBaseAmount * workerRate) / 100);
  const officeAmount = base.settlementBaseAmount - workerAmount;
  return {
    settlementBaseAmount: base.settlementBaseAmount,
    workerSettlementRate: workerRate,
    officeSettlementRate: officeRate,
    workerSettlementAmount: workerAmount,
    officeSettlementAmount: officeAmount,
    settlementStatus: "completed"
  };
}

export function summarizeMonth(jobs, month) {
  return jobs
    .filter((job) => String(job.workDate || "").startsWith(month))
    .reduce(
      (summary, job) => {
        const payment = getPaymentBreakdown(job);
        const settlement = resolveSettlement(job);
        const paid = payment.cash + payment.transfer + payment.card + payment.invoice;

        summary.jobCount += 1;
        summary.totalCharge += settlement.chargeAmount;
        summary.totalBaseCharge += settlement.baseChargeAmount;
        summary.totalMaterialCost += settlement.materialCost;
        summary.totalCommission += settlement.commissionAmount;
        summary.totalSettlementBase += settlement.settlementBaseAmount;
        summary.totalNetAmount += settlement.netAmount;
        summary.totalWorkerAmount += settlement.workerAmount;
        summary.totalOfficeAmount += settlement.officeAmount;
        if (settlement.settlementStatus === "completed") summary.completedCount += 1;
        else summary.pendingCount += 1;
        summary.cash += payment.cash;
        summary.transfer += payment.transfer;
        summary.card += payment.card;
        summary.invoice += payment.invoice;
        summary.totalPaid += paid;
        summary.difference += settlement.chargeAmount - paid;
        summary.jobs.push({
          ...job,
          ...settlement,
          paymentBreakdownResolved: payment,
          paymentDifferenceResolved: settlement.chargeAmount - paid
        });
        return summary;
      },
      {
        jobCount: 0,
        completedCount: 0,
        pendingCount: 0,
        totalCharge: 0,
        totalBaseCharge: 0,
        totalMaterialCost: 0,
        totalSettlementBase: 0,
        totalWorkerAmount: 0,
        totalOfficeAmount: 0,
        totalCommission: 0,
        totalNetAmount: 0,
        cash: 0,
        transfer: 0,
        card: 0,
        invoice: 0,
        totalPaid: 0,
        difference: 0,
        jobs: []
      }
    );
}
