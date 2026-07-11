export default function TopBar({ profile, user, onLogout, role }) {
  return (
    <header className="topbar">
      <div>
        <strong>GW ONE</strong>
        <small>
          {profile.businessName || user.displayName || user.email}
          {role ? ` · ${role}` : ""}
        </small>
      </div>
      <button className="text-button" onClick={onLogout}>
        로그아웃
      </button>
    </header>
  );
}
