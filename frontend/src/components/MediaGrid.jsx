import { useState } from "react";

// Simple paginated grid (not virtualized) — good enough for a few thousand
// thumbnails at a time thanks to server-side pagination. For very large
// libraries, swap in react-window without touching the API layer.
//
// Thumbnails come straight from item.thumbnailUrl, a Cloudinary
// transformation URL generated server-side (see mediaController.listMedia)
// — no separate thumbnail asset is stored or downloaded at full size.
export default function MediaGrid({ items, onSelectionChange, onOpenItem }) {
  const [selected, setSelected] = useState(new Set());

  function toggle(id) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    onSelectionChange?.(Array.from(next));
  }

  return (
    <div className="gallery-grid">
      {items.map((item) => (
        <div
          key={item._id}
          className={"gallery-item" + (selected.has(item._id) ? " selected" : "")}
          onClick={() => toggle(item._id)}
          onDoubleClick={() => onOpenItem?.(item)}
          title={item.filename}
        >
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt={item.filename} loading="lazy" />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 12, color: "var(--text-dim)" }}>
              {item.filename}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
