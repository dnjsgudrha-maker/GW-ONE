import { createWorker } from "tesseract.js";
import { normalizePhone } from "./formatters";

const REGION_PATTERN =
  /(서울(?:특별시)?|부산(?:광역시)?|대구(?:광역시)?|인천(?:광역시)?|광주(?:광역시)?|대전(?:광역시)?|울산(?:광역시)?|세종(?:특별자치시)?|제주(?:특별자치도)?|경기도|강원(?:특별자치도)?|충청북도|충청남도|전라북도|전북특별자치도|전라남도|경상북도|경상남도|[가-힣]{1,8}(?:시|군|구))/;

const NOISE_PATTERNS = [
  /저장되지 않은 번호에서 온 메시지입니다/gi,
  /스미싱이나 피싱에 유의하세요/gi,
  /수신 차단/gi,
  /메시지 신고/gi,
  /오전\s*\d{1,2}:\d{2}/gi,
  /오후\s*\d{1,2}:\d{2}/gi,
  /\d{1,2}월\s*\d{1,2}일\s*(?:월|화|수|목|금|토|일)요일/gi,
  /오늘|어제|내일/gi
];

function cleanText(value) {
  let text = String(value || "")
    .replace(/[|_~`^*<>[\]{}]/g, " ")
    .replace(/[•·]/g, " ")
    .replace(/\r/g, "\n");

  for (const pattern of NOISE_PATTERNS) {
    text = text.replace(pattern, " ");
  }

  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function cleanLine(value) {
  return String(value || "")
    .replace(/[|_~`^*<>[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPhone(text) {
  const candidates = String(text || "").match(
    /(?:\+?82[\s-]?)?0?1[016789][\s\-.)]*(?:\d[\s\-.)]*){7,8}/g
  );

  if (!candidates?.length) return "";

  return (
    candidates
      .map((value) => normalizePhone(value.replace(/^\+?82/, "0")))
      .find((value) => /^01\d-\d{3,4}-\d{4}$/.test(value)) || ""
  );
}

function normalizeAddressSpacing(value) {
  return String(value || "")
    .replace(/(\d+)\s*동\s*(\d+)\s*호/g, "$1동 $2호")
    .replace(/(\d+)\s*동(?=[가-힣])/g, "$1동 ")
    .replace(/([가-힣])(\d+(?:-\d+)?)(?=\s|$|[가-힣])/g, "$1 $2")
    .replace(/(로|길|대로)\s+(\d)/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

function cutAfterAddress(value) {
  let text = value;

  const stopPatterns = [
    /(?:오전|오후)\s*\d{1,2}:\d{2}/,
    /\d{1,2}월\s*\d{1,2}일/,
    /수신 차단/,
    /메시지 신고/,
    /입력창/,
    /전송/
  ];

  for (const pattern of stopPatterns) {
    const match = text.match(pattern);
    if (match?.index > 0) {
      text = text.slice(0, match.index);
    }
  }

  return text.trim();
}

function extractFromSingleLine(text) {
  const cleaned = cleanText(text).replace(/\n/g, " ");
  const regionMatch = cleaned.match(REGION_PATTERN);

  if (!regionMatch || regionMatch.index == null) return "";

  let candidate = cleaned.slice(regionMatch.index);
  candidate = cutAfterAddress(candidate);

  // 주소 뒤에 붙은 일반 안내 문구를 잘라냅니다.
  candidate = candidate.replace(
    /(저장되지 않은|스미싱|피싱|유의하세요|메시지입니다).*$/i,
    ""
  );

  // 동·호수가 있으면 그 지점까지만 사용합니다.
  const dongHo = candidate.match(/\d{1,4}\s*동\s*\d{1,4}\s*호/);
  if (dongHo?.index != null) {
    candidate = candidate.slice(0, dongHo.index + dongHo[0].length);
  } else {
    const ho = candidate.match(/\d{1,4}\s*호/);
    if (ho?.index != null) {
      candidate = candidate.slice(0, ho.index + ho[0].length);
    }
  }

  return normalizeAddressSpacing(candidate);
}

export function extractAddress(text) {
  const cleaned = cleanText(text);
  const lines = cleaned
    .split(/\n/)
    .map(cleanLine)
    .filter(Boolean);

  const phoneIndex = lines.findIndex((line) =>
    /01[016789][\s-]?\d{3,4}[\s-]?\d{4}/.test(line)
  );

  // 전화번호가 있으면 그 아래쪽을 우선 분석합니다.
  const searchLines =
    phoneIndex >= 0 && phoneIndex < lines.length - 1
      ? lines.slice(phoneIndex + 1)
      : lines;

  const picked = [];
  let started = false;

  for (const line of searchLines) {
    if (/01[016789][\s-]?\d{3,4}[\s-]?\d{4}/.test(line)) continue;

    const hasRegion = REGION_PATTERN.test(line);
    const hasRoad =
      /[가-힣0-9]+(?:대로|로|길)\s*\d+(?:-\d+)?/.test(line);
    const hasBuilding =
      /(아파트|빌라|오피스텔|주택|상가|타워|마을|단지|빌딩|하우스|캐슬|힐스테이트|푸르지오|자이|비발디|아이파크)/.test(
        line
      );
    const hasDongHo =
      /\d{1,4}\s*동\s*\d{1,4}\s*호|\d{1,4}\s*동|\d{1,4}\s*호/.test(line);

    if (hasRegion || hasRoad || hasBuilding || hasDongHo) {
      let candidate = line;

      // 한 줄 안에 안내 문구와 주소가 같이 들어온 경우 주소 시작점부터 자릅니다.
      const regionMatch = candidate.match(REGION_PATTERN);
      if (regionMatch?.index != null && regionMatch.index > 0) {
        candidate = candidate.slice(regionMatch.index);
      }

      picked.push(candidate);
      started = true;

      if (hasDongHo) break;
      continue;
    }

    if (started) {
      // 주소가 시작된 뒤 나오는 건물명/동호수 후보만 추가합니다.
      if (/[가-힣].*\d|\d.*[가-힣]/.test(line)) {
        picked.push(line);
        if (/\d{1,4}\s*호/.test(line)) break;
      } else {
        break;
      }
    }
  }

  const multiLineCandidate = normalizeAddressSpacing(
    [...new Set(picked)].join(" ")
  );

  // OCR이 모든 글자를 한 줄로 뭉친 경우 별도 추출기를 사용합니다.
  const singleLineCandidate = extractFromSingleLine(cleaned);

  const candidates = [multiLineCandidate, singleLineCandidate]
    .map((value) => value.trim())
    .filter(Boolean)
    .sort((a, b) => {
      const aScore =
        (REGION_PATTERN.test(a) ? 3 : 0) +
        (/(대로|로|길)\d/.test(a) ? 3 : 0) +
        (/\d+동\s*\d+호/.test(a) ? 3 : 0) +
        (/(아파트|빌라|비발디|자이|푸르지오|힐스테이트)/.test(a) ? 2 : 0);

      const bScore =
        (REGION_PATTERN.test(b) ? 3 : 0) +
        (/(대로|로|길)\d/.test(b) ? 3 : 0) +
        (/\d+동\s*\d+호/.test(b) ? 3 : 0) +
        (/(아파트|빌라|비발디|자이|푸르지오|힐스테이트)/.test(b) ? 2 : 0);

      return bScore - aScore || a.length - b.length;
    });

  return candidates[0] || "";
}

export async function analyzeOrderImage(file, onProgress) {
  let worker;

  try {
    worker = await createWorker(["kor", "eng"], 1, {
      logger: (message) => {
        if (typeof message.progress === "number") {
          onProgress?.(Math.round(message.progress * 100));
        }
      }
    });

    const result = await worker.recognize(file);
    const text = result?.data?.text || "";

    return {
      text,
      phone: extractPhone(text),
      address: extractAddress(text)
    };
  } finally {
    if (worker) await worker.terminate();
  }
}
