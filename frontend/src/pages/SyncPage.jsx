import { useEffect, useState } from "react";
import client from "../api/client";

export default function SyncPage() {
  const [device, setDevice] = useState(null);

  async function load() {
    const res = await client.get("/devices");
    setDevice(res.data.devices[0] || null);
  }
  useEffect(() => { load(); }, []);

  async function syncNow() {
    if (!device) return;
    await client.post("/commands", { deviceId: device._id, type: "SYNC_NOW" });
    alert("Sync command queued. The phone will pick it up next poll.");
  }

  if (!device) return <p>No paired device yet. Go to Devices to pair your phone.</p>;

  return (
    <div>
      <h2>Sync</h2>
      <div className="card" style={{ maxWidth: 420 }}>
        <p><strong>{device.name}</strong> — <span className={"badge " + device.status}>{device.status}</span></p>
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
          Backup: {device.backupEnabled ? "ON" : "OFF"} · Wi-Fi only: {device.wifiOnly ? "Yes" : "No"} · Charging only: {device.chargingOnly ? "Yes" : "No"}
        </p>
        <div className="toolbar">
          <button className="btn" onClick={syncNow}>Sync now</button>
        </div>
      </div>
    </div>
  );
}
