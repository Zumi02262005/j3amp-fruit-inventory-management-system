import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";
import logo from "../assets/icons/logo.svg";

const Login = () => {
  const [username, setUsername] = useState(""); // ✅ Changed from email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      // Get the user from the result or context
      const savedUser = JSON.parse(localStorage.getItem("user"));
      const role = savedUser?.role;
      console.log(role)

      // Logic-based redirection
      if (role === "admin") {
        navigate("/admin-dashboard");
      } else if (role === "inbound") {
        navigate("/inbound-dashboard");
      } else if (role === "outbound") {
        navigate("/outbound-dashboard");
      } else {
        navigate("/dashboard");
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Logo" className="logo" />
      <div className="background-container">
        <div className="login-card">
          <p className="welcome-text">Welcome!</p>
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
