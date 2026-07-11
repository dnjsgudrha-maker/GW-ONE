export function downloadJsonBackup({ jobs, profile, exportedBy }) {
  const payload = {
    app: "GW ONE",
    version: "3.0.0",
    exportedAt: new Date().toISOString(),
    exportedBy: exportedBy || "",
    profile: profile || {},
    jobs: jobs || []
  };

  const blob = new Blob(
    [JSON.stringify(payload, null, 2)],
    { type: "application/json;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `GW_ONE_백업_${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
