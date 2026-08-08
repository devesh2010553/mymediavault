import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const res = await login(email, password);
    if (res.ok) navigate("/");
    else setError(res.error);
  }

  return (
    <div className="login-screen">
      <form className="login-box card" onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>MyMediaVault</h2>
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: -8 }}>Admin Login</p>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

        <button className="btn" type="submit" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
