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

export function resolveSettlement(job) {
  const chargeAmount = numberValue(job?.chargeAmount);
  const baseChargeAmount = numberValue(job?.baseChargeAmount) || chargeAmount;
  const materialCost = numberValue(job?.materialCost);
  const settlementBaseAmount = Math.max(
    0,
    numberValue(job?.settlementBaseAmount) || baseChargeAmount - materialCost
  );
  const workerRate = Math.min(100, Math.max(0, numberValue(job?.workerSettlementRate)));
  const officeRate = 100 - workerRate;
  const workerAmount =
    job?.settlementStatus === "completed"
      ? numberValue(job?.workerSettlementAmount)
      : 0;
  const officeAmount =
    job?.settlementStatus === "completed"
      ? numberValue(job?.officeSettlementAmount)
      : 0;

  return {
    chargeAmount,
    baseChargeAmount,
    materialCost,
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
        summary.totalSettlementBase += settlement.settlementBaseAmount;
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
