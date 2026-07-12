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

export function getDocumentBusinesses(profile = {}) {
  const own = ownBusinessFromProfile(profile);
  const extras = Array.isArray(profile.documentBusinesses)
    ? profile.documentBusinesses.filter((item) => item?.businessName)
    : [];

  return [own, ...extras];
}

export function resolveDocumentBusiness(profile, businessId, fallback = null) {
  const found = getDocumentBusinesses(profile).find(
    (item) => item.id === businessId
  );

  return found || fallback || ownBusinessFromProfile(profile);
}
