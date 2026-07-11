function joinKorean(items) {
  const values = (items || []).filter(Boolean);
  if (!values.length) return "";
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(", ")} 및 ${values.at(-1)}`;
}

function sentence(text) {
  const value = String(text || "").trim();
  if (!value) return "";
  return /[.!?。]$/.test(value) ? value : `${value}.`;
}

export function generateLeakOpinion(leakData = {}, job = {}) {
  const paragraphs = [];

  const tests = joinKorean(leakData.tests);
  if (tests) {
    paragraphs.push(
      `현장 방문 후 누수 여부와 배관 상태를 확인하기 위해 ${tests}를 실시하였습니다.`
    );
  } else {
    paragraphs.push(
      "현장 방문 후 누수 여부와 배관 상태를 확인하기 위한 점검을 진행하였습니다."
    );
  }

  if (leakData.pressureDrop) {
    paragraphs.push(
      `점검 과정에서 압력 변화는 ${leakData.pressureDrop}로 확인되었습니다.`
    );
  }

  if (leakData.leakLocation) {
    paragraphs.push(
      `탐지 결과 누수 의심 또는 확인 지점은 ${leakData.leakLocation}로 확인되었습니다.`
    );
  }

  const openings = joinKorean(leakData.openings);
  const pipes = joinKorean(leakData.pipes);
  const causes = joinKorean(leakData.causes);

  if (openings || pipes || causes) {
    const parts = [];
    if (openings) parts.push(`${openings}을 진행하여 해당 부위를 확인하였고`);
    if (pipes) parts.push(`${pipes}에서`);
    if (causes) parts.push(`${causes}이 확인되었습니다`);

    paragraphs.push(sentence(parts.join(" ")));
  }

  const actions = joinKorean(leakData.actions);
  if (actions) {
    paragraphs.push(`확인된 누수 부위에 대하여 ${actions}을 실시하였습니다.`);
  }

  const results = joinKorean(leakData.results);
  if (results) {
    paragraphs.push(`작업 후 재점검 결과 ${results}되었습니다.`);
  }

  if (job.asPeriod && job.asPeriod !== "없음") {
    paragraphs.push(`본 작업의 A/S 기간은 ${job.asPeriod}입니다.`);
  }

  if (leakData.extraNote) {
    paragraphs.push(sentence(leakData.extraNote));
  }

  paragraphs.push(
    "상기 내용은 현장 점검 및 실제 작업 내용을 기준으로 작성하였습니다."
  );

  return paragraphs.filter(Boolean).join("\n\n");
}
