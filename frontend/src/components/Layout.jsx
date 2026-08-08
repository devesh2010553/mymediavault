import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/photos", label: "Photos" },
  { to: "/videos", label: "Videos" },
  { to: "/devices", label: "Devices" },
  { to: "/sync", label: "Sync" },
  { to: "/settings", label: "Settings" },
];

export default function Layout() {
  const { logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>MyMediaVault</h1>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
          >
            {l.label}
          </NavLink>
        ))}
        <div style={{ marginTop: 24 }}>
          <button className="btn secondary" style={{ width: "100%" }} onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
