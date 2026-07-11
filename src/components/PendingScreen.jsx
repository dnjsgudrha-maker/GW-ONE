export default function PendingScreen({ profile, onLogout }) {
  const disabled = profile?.disabled === true;

  return (
    <main className="login-page">
      <section className="login-card pending-card">
        <div className="brand-mark">GW</div>
        <h1>{disabled ? "사용이 중지되었습니다" : "가입 승인 대기 중"}</h1>
        <p>
          {disabled
            ? "관리자에게 사용 재승인을 요청해 주세요."
            : "관리자가 계정을 승인하면 GW ONE을 사용할 수 있습니다."}
        </p>
        <button className="google-button" onClick={onLogout}>
          로그아웃
        </button>
      </section>
    </main>
  );
}
