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

export function summarizeMonth(jobs, month) {
  return jobs
    .filter((job) => String(job.workDate || "").startsWith(month))
    .reduce(
      (summary, job) => {
        const payment = getPaymentBreakdown(job);
        const charge = numberValue(job.chargeAmount);
        const paid = payment.cash + payment.transfer + payment.card + payment.invoice;

        summary.jobCount += 1;
        summary.totalCharge += charge;
        summary.cash += payment.cash;
        summary.transfer += payment.transfer;
        summary.card += payment.card;
        summary.invoice += payment.invoice;
        summary.totalPaid += paid;
        summary.difference += charge - paid;
        summary.jobs.push({
          ...job,
          paymentBreakdownResolved: payment,
          paymentDifferenceResolved: charge - paid
        });
        return summary;
      },
      {
        jobCount: 0,
        totalCharge: 0,
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
