export function normalizePhoneKey(value) {
  return String(value || "").replace(/\D/g, "");
}

export function buildCustomerGroups(jobs) {
  const groups = new Map();

  for (const job of jobs) {
    const phoneKey = normalizePhoneKey(job.phone);
    const addressKey = String(job.address || "").trim().toLowerCase();
    const key = phoneKey || addressKey;

    if (!key) continue;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        phone: job.phone || "",
        address: job.address || "",
        jobs: []
      });
    }

    const group = groups.get(key);
    group.jobs.push(job);

    if (!group.phone && job.phone) group.phone = job.phone;
    if (!group.address && job.address) group.address = job.address;
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      jobs: [...group.jobs].sort((a, b) =>
        String(b.workDate || "").localeCompare(String(a.workDate || ""))
      ),
      totalCharge: group.jobs.reduce(
        (sum, job) => sum + Number(job.chargeAmount || 0),
        0
      ),
      latestJob: [...group.jobs].sort((a, b) =>
        String(b.workDate || "").localeCompare(String(a.workDate || ""))
      )[0]
    }))
    .sort((a, b) =>
      String(b.latestJob?.workDate || "").localeCompare(
        String(a.latestJob?.workDate || "")
      )
    );
}

export function getCustomerHistory(jobs, phone, address) {
  const phoneKey = normalizePhoneKey(phone);
  const addressKey = String(address || "").trim().toLowerCase();

  return jobs
    .filter((job) => {
      const samePhone =
        phoneKey &&
        normalizePhoneKey(job.phone) &&
        normalizePhoneKey(job.phone) === phoneKey;

      const sameAddress =
        addressKey &&
        String(job.address || "").trim().toLowerCase() === addressKey;

      return samePhone || sameAddress;
    })
    .sort((a, b) =>
      String(b.workDate || "").localeCompare(String(a.workDate || ""))
    );
}

export function addMonths(dateString, months) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addYears(dateString, years) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

export function getAsExpiry(workDate, asPeriod) {
  if (!workDate || !asPeriod || asPeriod === "없음") return null;

  if (asPeriod.endsWith("개월")) {
    return addMonths(workDate, Number(asPeriod.replace(/\D/g, "")) || 0);
  }

  if (asPeriod.endsWith("년")) {
    return addYears(workDate, Number(asPeriod.replace(/\D/g, "")) || 0);
  }

  return null;
}

export function formatDate(date) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function getAsStatus(workDate, asPeriod) {
  const expiry = getAsExpiry(workDate, asPeriod);

  if (!expiry) {
    return {
      label: "AS 없음",
      active: false,
      expiry: null,
      remainingDays: null
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(23, 59, 59, 999);

  const remainingDays = Math.ceil(
    (expiry.getTime() - today.getTime()) / 86400000
  );

  return {
    label:
      remainingDays >= 0
        ? `AS 가능 · ${remainingDays}일 남음`
        : `AS 종료 · ${Math.abs(remainingDays)}일 경과`,
    active: remainingDays >= 0,
    expiry,
    remainingDays
  };
}
