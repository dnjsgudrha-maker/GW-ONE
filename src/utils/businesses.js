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


export const HEAD_OFFICE_BUSINESS_NAME = "지더블유솔루션";

export function headOfficeBusinessFromProfile(profile = {}) {
  const saved = profile.headOfficeBusiness;

  if (saved?.businessName) {
    return {
      id: saved.id || "head-office",
      businessName: HEAD_OFFICE_BUSINESS_NAME,
      representativeName: saved.representativeName || "",
      businessNumber: saved.businessNumber || "",
      contact: saved.contact || "",
      businessEmail: saved.businessEmail || "",
      businessAddress: saved.businessAddress || "",
      stampDataUrl: saved.stampDataUrl || "",
      isHeadOffice: true
    };
  }

  return {
    ...ownBusinessFromProfile(profile),
    id: "head-office",
    businessName: HEAD_OFFICE_BUSINESS_NAME,
    isHeadOffice: true
  };
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
    return headOfficeBusinessFromProfile(profile);
  }

  if (fallback?.businessName && fallback.id === businessId) {
    return fallback;
  }

  const found = getDocumentBusinesses(profile, allProfiles).find(
    (item) => item.id === businessId
  );

  return found || fallback || ownBusinessFromProfile(profile);
}
