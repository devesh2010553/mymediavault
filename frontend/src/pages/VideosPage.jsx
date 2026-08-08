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
    setPlaying({ item, url: res.data.url, poster: item.thumbnailUrl });
  }

  return (
    <div>
      <h2>Videos ({total})</h2>
      <table>
        <thead>
          <tr>
            <th></th><th>Filename</th><th>Duration</th><th>Size</th><th>Date</th><th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const durationSeconds = item.duration || item.cloudinaryDuration;
            return (
              <tr key={item._id}>
                <td>
                  {item.thumbnailUrl && (
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, display: "block" }}
                    />
                  )}
                </td>
                <td>{item.filename}</td>
                <td>{durationSeconds ? `${Math.round(durationSeconds)}s` : "-"}</td>
                <td>{((item.cloudinaryBytes || item.size) / (1024 * 1024)).toFixed(1)} MB</td>
                <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</td>
                <td>
                  <button className="btn secondary" onClick={() => play(item)}>Play</button>
                </td>
              </tr>
            );
          })}
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
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 60 }}
          onClick={() => setPlaying(null)}
        >
          <video
            src={playing.url}
            poster={playing.poster}
            controls
            autoPlay
            style={{ maxWidth: "90%", maxHeight: "80%" }}
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{ marginTop: 12, display: "flex", gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <a href={playing.url} download={playing.item.filename} target="_blank" rel="noreferrer">
              <button className="btn secondary">Download</button>
            </a>
            <button className="btn secondary" onClick={() => setPlaying(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
