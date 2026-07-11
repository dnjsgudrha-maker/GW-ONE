export default function LoginScreen({ onLogin, notice }) {
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">GW</div>
        <h1>GW ONE</h1>
        <p>현장의 모든 것을 하나로.</p>
        <button className="google-button" onClick={onLogin}>
          <span className="google-g">G</span>
          Google 계정으로 시작
        </button>
        {notice && <p className="notice error">{notice}</p>}
      </section>
    </main>
  );
}
