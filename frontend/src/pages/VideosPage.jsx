import { useEffect, useState, useCallback } from "react";
import client from "../api/client";

export default function VideosPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [playing, setPlaying] = useState(null);
  const limit = 40;

  const load = useCallback(async () => {
    const res = await client.get("/media", { params: { mediaType: "video", page, limit } });
    setItems(res.data.items);
    setTotal(res.data.total);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function play(item) {
    const res = await client.get(`/media/${item._id}/url`);
    setPlaying({ item, url: res.data.url });
  }

  return (
    <div>
      <h2>Videos ({total})</h2>
      <table>
        <thead>
          <tr>
            <th>Filename</th><th>Duration</th><th>Size</th><th>Date</th><th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.filename}</td>
              <td>{item.duration ? `${Math.round(item.duration)}s` : "-"}</td>
              <td>{(item.size / (1024 * 1024)).toFixed(1)} MB</td>
              <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</td>
              <td><button className="btn secondary" onClick={() => play(item)}>Play</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="toolbar" style={{ marginTop: 16 }}>
        <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span style={{ color: "var(--text-dim)", fontSize: 13 }}>
          Page {page} of {Math.max(1, Math.ceil(total / limit))}
        </span>
        <button className="btn secondary" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      {playing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setPlaying(null)}>
          <video src={playing.url} controls autoPlay style={{ maxWidth: "90%", maxHeight: "90%" }} />
        </div>
      )}
    </div>
  );
}
