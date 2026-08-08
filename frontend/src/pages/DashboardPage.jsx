import { useEffect, useState } from "react";
import client from "../api/client";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      const [photosRes, videosRes, devicesRes] = await Promise.all([
        client.get("/media", { params: { mediaType: "photo", limit: 1 } }),
        client.get("/media", { params: { mediaType: "video", limit: 1 } }),
        client.get("/devices"),
      ]);
      const device = devicesRes.data.devices[0];
      setStats({
        photos: photosRes.data.total,
        videos: videosRes.data.total,
        device,
      });
    }
    load();
  }, []);

  if (!stats) return <p>Loading...</p>;

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="card-grid">
        <div className="card">
          <div className="stat-value">{stats.photos}</div>
          <div className="stat-label">Photos</div>
        </div>
        <div className="card">
          <div className="stat-value">{stats.videos}</div>
          <div className="stat-label">Videos</div>
        </div>
        <div className="card">
          <div className="stat-value">
            <span className={"badge " + (stats.device?.status || "offline")}>
              {stats.device?.status || "No device"}
            </span>
          </div>
          <div className="stat-label">Phone status</div>
        </div>
        <div className="card">
          <div className="stat-value" style={{ fontSize: 16 }}>
            {stats.device?.lastSyncAt ? new Date(stats.device.lastSyncAt).toLocaleString() : "Never"}
          </div>
          <div className="stat-label">Last sync</div>
        </div>
      </div>
    </div>
  );
}
