import { useEffect, useState, useCallback } from "react";
import client from "../api/client";
import MediaGrid from "../components/MediaGrid.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

export default function PhotosPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [confirmMode, setConfirmMode] = useState(null);
  const limit = 60;

  const load = useCallback(async () => {
    const res = await client.get("/media", {
      params: { mediaType: "photo", page, limit, search: search || undefined },
    });
    setItems(res.data.items);
    setTotal(res.data.total);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  async function resolveThumb(item) {
    return null; // thumbnails are fetched lazily via /media/:id/url in a real UI; omitted here for brevity
  }

  async function handleDelete(mode) {
    const device = (await client.get("/devices")).data.devices[0];
    if (mode !== "cloud" && !device) return;
    await client.post("/commands/delete-request", {
      deviceId: device?._id,
      mediaIds: selected,
      mode,
    });
    setConfirmMode(null);
    setSelected([]);
    load();
  }

  return (
    <div>
      <h2>Photos ({total})</h2>
      <div className="toolbar">
        <input
          className="input"
          style={{ maxWidth: 260 }}
          placeholder="Search filename..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        {selected.length > 0 && (
          <>
            <button className="btn secondary">{selected.length} selected</button>
            <button className="btn" onClick={() => client.get("/media") /* download flow via signed URL per item */}>
              Download
            </button>
            <button className="btn danger" onClick={() => setConfirmMode("cloud")}>Delete cloud copy</button>
            <button className="btn danger" onClick={() => setConfirmMode("phone")}>Delete from phone</button>
            <button className="btn danger" onClick={() => setConfirmMode("both")}>Delete both</button>
          </>
        )}
      </div>

      <MediaGrid items={items} onSelectionChange={setSelected} resolveThumb={null} />

      <div className="toolbar" style={{ marginTop: 16 }}>
        <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span style={{ color: "var(--text-dim)", fontSize: 13 }}>
          Page {page} of {Math.max(1, Math.ceil(total / limit))}
        </span>
        <button className="btn secondary" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      <ConfirmDialog
        open={!!confirmMode}
        title="Delete media"
        items={[
          confirmMode === "cloud" && "Delete the backup from MyMediaVault",
          confirmMode === "phone" && "Request deletion from the Android phone",
          confirmMode === "both" && "Delete the MyMediaVault backup AND request deletion from the phone",
        ].filter(Boolean)}
        onConfirm={() => handleDelete(confirmMode)}
        onCancel={() => setConfirmMode(null)}
      />
    </div>
  );
}
