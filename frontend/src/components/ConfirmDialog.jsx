export default function ConfirmDialog({ open, title, items, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
      }}
    >
      <div className="card" style={{ width: 380 }}>
        <h3 style={{ marginTop: 0 }}>{title || "Are you sure?"}</h3>
        <ul style={{ color: "var(--text-dim)", fontSize: 14 }}>
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
        <p style={{ fontSize: 13, color: "var(--danger)" }}>This cannot be undone.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn secondary" onClick={onCancel}>Cancel</button>
          <button className="btn danger" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
