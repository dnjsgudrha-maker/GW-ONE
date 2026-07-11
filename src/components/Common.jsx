export function Field({ label, required, children }) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <b> *</b>}
      </span>
      {children}
    </label>
  );
}

export function CenteredCard({ title, text }) {
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">GW</div>
        <h1>{title}</h1>
        <p>{text}</p>
      </section>
    </main>
  );
}
