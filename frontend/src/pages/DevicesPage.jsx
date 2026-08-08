import { useEffect, useState } from "react";
import client from "../api/client";

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [pairingCode, setPairingCode] = useState(null);

  async function load() {
    const res = await client.get("/devices");
    setDevices(res.data.devices);
  }
  useEffect(() => { load(); }, []);

  async function generateCode() {
    const res = await client.post("/devices/pairing-code");
    setPairingCode(res.data);
  }

  async function revoke(id) {
    if (!confirm("Revoke this device? It will no longer be able to sync or receive commands.")) return;
    await client.post(`/devices/${id}/revoke`);
    load();
  }

  return (
    <div>
      <h2>Devices</h2>

      <div className="card" style={{ marginBottom: 20, maxWidth: 320 }}>
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 0 }}>
          Generate a one-time code and enter it in the MyMediaVault Android app to pair this phone.
        </p>
        <button className="btn" onClick={generateCode}>Generate pairing code</button>
        {pairingCode && (
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <div style={{ fontSize: 32, letterSpacing: 4, fontWeight: 700 }}>{pairingCode.code}</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
              Expires {new Date(pairingCode.expiresAt).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      <table>
        <thead>
          <tr><th>Name</th><th>Status</th><th>Last heartbeat</th><th>Last sync</th><th></th></tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d._id}>
              <td>{d.name}</td>
              <td><span className={"badge " + d.status}>{d.status}</span></td>
              <td>{d.lastHeartbeatAt ? new Date(d.lastHeartbeatAt).toLocaleString() : "-"}</td>
              <td>{d.lastSyncAt ? new Date(d.lastSyncAt).toLocaleString() : "-"}</td>
              <td>
                {!d.revoked ? (
                  <button className="btn danger" onClick={() => revoke(d._id)}>Revoke access</button>
                ) : (
                  <span style={{ color: "var(--text-dim)", fontSize: 13 }}>Revoked</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
