export default function SettingsPage() {
  return (
    <div>
      <h2>Settings</h2>
      <div className="card" style={{ maxWidth: 420 }}>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
          Storage provider, retention, and other server-level settings are configured via
          environment variables on the backend (see backend/.env.example). This is a
          single-admin private system — there is no user management here by design.
        </p>
        <a href="https://photos.google.com" target="_blank" rel="noreferrer">
          <button className="btn secondary">Open Google Photos</button>
        </a>
      </div>
    </div>
  );
}
