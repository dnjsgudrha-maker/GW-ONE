import { COMPANY } from "../config/company";

export function ownBusinessFromProfile(profile = {}) {
  return {
    id: "own",
    businessName: profile.businessName || "",
    representativeName: profile.representativeName || "",
    businessNumber: profile.businessNumber || "",
    contact: profile.contact || "",
    businessEmail: profile.businessEmail || "",
    businessAddress: profile.businessAddress || "",
    stampDataUrl: profile.stampDataUrl || profile.stampUrl || "",
    isOwn: true
  };
}

export const HEAD_OFFICE_BUSINESS_NAME = COMPANY.businessName;

function normalizeHeadOffice(source = {}) {
  return {
    id: "head-office",
    businessName: COMPANY.businessName,
    representativeName: source.representativeName || COMPANY.representativeName,
    businessNumber: source.businessNumber || COMPANY.businessNumber,
    contact: source.contact || COMPANY.contact,
    businessEmail: source.businessEmail || COMPANY.businessEmail,
    businessAddress: source.businessAddress || COMPANY.businessAddress,
    stampDataUrl:
      source.stampDataUrl || source.stampUrl || COMPANY.stampDataUrl,
    isHeadOffice: true
  };
}

export function headOfficeBusinessFromProfile(profile = {}, allProfiles = []) {
  // 1순위: 인증된 전역 본사 설정(companySettings/headOffice) 또는
  // 기사 프로필에 동기화된 본사 스냅샷. 기사 자신의 업체정보는 사용하지 않습니다.
  const saved = profile.headOfficeBusiness || {};

  // 2순위: 전체 프로필을 볼 수 있는 관리자 화면에서는 최고관리자/본사 프로필.
  const headquartersProfile = (allProfiles || []).find((item) => {
    const role = String(item?.role || "").trim().toLowerCase();
    const businessName = String(item?.businessName || "").replace(/\s/g, "");
    const configuredName = String(COMPANY.businessName || "").replace(/\s/g, "");
    return (
      role === "최고관리자" ||
      role === "대표" ||
      role === "owner" ||
      role === "representative" ||
      businessName === configuredName ||
      businessName.includes("지더블유솔루션")
    );
  });

  const currentRole = String(profile.role || "").trim().toLowerCase();
  const currentIsHeadOffice =
    currentRole === "최고관리자" ||
    currentRole === "대표" ||
    currentRole === "owner" ||
    currentRole === "representative";

  const source =
    (saved.businessNumber || saved.representativeName || saved.businessAddress
      ? saved
      : null) ||
    headquartersProfile ||
    (currentIsHeadOffice ? profile : {}) ||
    {};

  return normalizeHeadOffice(source);
}

function workerBusinessFromProfile(worker = {}) {
  return {
    id: `worker-${worker.uid || worker.email || worker.businessNumber}`,
    businessName: worker.businessName || "",
    representativeName: worker.representativeName || "",
    businessNumber: worker.businessNumber || "",
    contact: worker.contact || "",
    businessEmail: worker.businessEmail || "",
    businessAddress: worker.businessAddress || "",
    stampDataUrl: worker.stampDataUrl || worker.stampUrl || "",
    sourceUid: worker.uid || "",
    isWorkerBusiness: true
  };
}

function businessKey(business = {}) {
  return [
    String(business.businessName || "").trim(),
    String(business.businessNumber || "").replace(/\D/g, "")
  ].join("|");
}

export function getDocumentBusinesses(profile = {}, allProfiles = []) {
  const own = ownBusinessFromProfile(profile);
  const extras = Array.isArray(profile.documentBusinesses)
    ? profile.documentBusinesses
        .filter((item) => item?.businessName)
        .map((item, index) => ({
          ...item,
          id:
            item.id ||
            `extra-${String(item.businessNumber || "").replace(/\D/g, "") || index}`
        }))
    : [];

  const workerBusinesses = Array.isArray(allProfiles)
    ? allProfiles
        .filter(
          (item) =>
            item?.businessName &&
            item?.uid !== profile.uid &&
            item?.disabled !== true
        )
        .map(workerBusinessFromProfile)
    : [];

  const result = [];
  const used = new Set();

  [own, ...extras, ...workerBusinesses].forEach((business) => {
    if (!business?.businessName) return;
    const key = businessKey(business);
    if (used.has(key)) return;
    used.add(key);
    result.push(business);
  });

  return result.length ? result : [own];
}

export function resolveDocumentBusiness(
  profile,
  businessId,
  fallback = null,
  allProfiles = [],
  useHeadOffice = false
) {
  if (useHeadOffice) {
    return headOfficeBusinessFromProfile(profile, allProfiles);
  }

  if (fallback?.businessName && fallback.id === businessId) {
    return fallback;
  }

  const found = getDocumentBusinesses(profile, allProfiles).find(
    (item) => item.id === businessId
  );

  return found || fallback || ownBusinessFromProfile(profile);
}
