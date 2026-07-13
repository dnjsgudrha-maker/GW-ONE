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
    ? profile.documentBusinesses.filter((item) => item?.businessName)
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
  allProfiles = []
) {
  const found = getDocumentBusinesses(profile, allProfiles).find(
    (item) => item.id === businessId
  );

  return found || fallback || ownBusinessFromProfile(profile);
}
