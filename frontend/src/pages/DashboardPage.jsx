import { useEffect, useState } from "react";
import client from "../api/client";

function formatBytes(bytes) {
  if (!bytes) return "0 GB";
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
        // totalStorageBytes reflects all media in Cloudinary regardless of
        // the mediaType filter used for this particular request.
        totalStorageBytes: photosRes.data.totalStorageBytes,
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
          <div className="stat-value">{formatBytes(stats.totalStorageBytes)}</div>
          <div className="stat-label">Cloud storage used</div>
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
        {stats.device && (
          <div className="card">
            <div className="stat-value" style={{ fontSize: 16 }}>
              {stats.device.model || stats.device.name}
              {stats.device.androidVersion ? ` · Android ${stats.device.androidVersion}` : ""}
            </div>
            <div className="stat-label">Device</div>
          </div>
        )}
      </div>
    </div>
  );
}
