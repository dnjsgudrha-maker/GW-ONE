import { formatWon } from "./formatters";

export function buildJobShareText(job) {
  const lines = [
    "[GW ONE 작업내용]",
    `작업일: ${job.workDate || "-"}`,
    `주소: ${job.address || "-"}`,
    `연락처: ${job.phone || "-"}`,
    `작업종류: ${job.jobType || "-"}`,
    `작업자: ${job.worker || "-"}`,
    `작업내용: ${job.workContent || "-"}`,
    `작업결과: ${job.result || "-"}`,
    `청구금액: ${formatWon(job.chargeAmount || 0)}`,
    `AS 기간: ${job.asPeriod || "없음"}`
  ];

  if (job.followUpDate) {
    lines.push(
      `${job.followUpType || "재방문"} 예정: ${job.followUpDate}`
    );
  }

  return lines.join("\n");
}

export async function shareJob(job) {
  const text = buildJobShareText(job);

  if (navigator.share) {
    await navigator.share({
      title: "GW ONE 작업내용",
      text
    });
    return "공유창을 열었습니다.";
  }

  await navigator.clipboard.writeText(text);
  return "작업내용을 복사했습니다.";
}
