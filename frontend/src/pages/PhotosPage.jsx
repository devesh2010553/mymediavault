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
  const [viewer, setViewer] = useState(null); // { item, url }
  const limit = 60;

  const load = useCallback(async () => {
    const res = await client.get("/media", {
      params: { mediaType: "photo", page, limit, search: search || undefined },
    });
    setItems(res.data.items);
    setTotal(res.data.total);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  async function openViewer(item) {
    const res = await client.get(`/media/${item._id}/url`);
    setViewer({ item, url: res.data.url });
  }

  async function downloadSelected() {
    for (const id of selected) {
      const res = await client.get(`/media/${id}/url`);
      const item = items.find((i) => i._id === id);
      const a = document.createElement("a");
      a.href = res.data.url;
      a.download = item?.filename || "download";
      a.target = "_blank";
      a.rel = "noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
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
            <button className="btn" onClick={downloadSelected}>Download</button>
            <button className="btn danger" onClick={() => setConfirmMode("cloud")}>Delete cloud copy</button>
            <button className="btn danger" onClick={() => setConfirmMode("phone")}>Delete from phone</button>
            <button className="btn danger" onClick={() => setConfirmMode("both")}>Delete both</button>
          </>
        )}
      </div>

      <MediaGrid items={items} onSelectionChange={setSelected} onOpenItem={openViewer} />

      <div className="toolbar" style={{ marginTop: 16 }}>
        <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span style={{ color: "var(--text-dim)", fontSize: 13 }}>
          Page {page} of {Math.max(1, Math.ceil(total / limit))}
        </span>
        <button className="btn secondary" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      {viewer && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 60 }}
          onClick={() => setViewer(null)}
        >
          <img
            src={viewer.url}
            alt={viewer.item.filename}
            style={{ maxWidth: "90%", maxHeight: "85%", objectFit: "contain" }}
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{ marginTop: 12, display: "flex", gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <a href={viewer.url} download={viewer.item.filename} target="_blank" rel="noreferrer">
              <button className="btn secondary">Download</button>
            </a>
            <button className="btn secondary" onClick={() => setViewer(null)}>Close</button>
          </div>
        </div>
      )}

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
