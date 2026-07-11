export function formatWon(value) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

export function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("010")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10 && digits.startsWith("01")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return value?.trim() || "";
}


export function formatNumericInput(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("ko-KR") : "";
}

export function rawNumericValue(value) {
  return String(value || "").replace(/\D/g, "");
}
