import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import PhotosPage from "./pages/PhotosPage.jsx";
import VideosPage from "./pages/VideosPage.jsx";
import DevicesPage from "./pages/DevicesPage.jsx";
import SyncPage from "./pages/SyncPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

function RequireAuth({ children }) {
  const hasToken = !!localStorage.getItem("mmv_access_token");
  if (!hasToken) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="photos" element={<PhotosPage />} />
        <Route path="videos" element={<VideosPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="sync" element={<SyncPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
