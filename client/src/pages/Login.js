// Login.jsx
// This page handles user authentication and role-based redirection after login.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";
import logo from "../assets/icons/logo.svg";

const Login = () => {
  // State for storing the username input value
  const [username, setUsername] = useState("");

  // State for storing the password input value
  const [password, setPassword] = useState("");

  // State for storing error messages returned from failed login attempts
  const [error, setError] = useState("");

  // State for tracking whether a login request is currently in progress
  const [loading, setLoading] = useState(false);

  // Retrieves the login function from the global AuthContext
  const { login } = useAuth();

  // Hook used to programmatically navigate to different routes after login
  const navigate = useNavigate();

  // Handles form submission when the user clicks "Sign in"
  // - Prevents default form behavior
  // - Calls the login function from AuthContext with the entered credentials
  // - On success, retrieves the user's role from localStorage and redirects accordingly
  // - On failure, displays the error message returned by the login function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      // Retrieve the saved user object from localStorage to determine their role
      const savedUser = JSON.parse(localStorage.getItem("user"));
      const role = savedUser?.role;
      console.log(role);

      // Redirect the user to the appropriate dashboard based on their role
      if (role === "admin") {
        navigate("/admin-dashboard");
      } else if (role === "inbound") {
        navigate("/inbound-dashboard");
      } else if (role === "outbound") {
        navigate("/outbound-dashboard");
      } else {
        // Fallback route for unrecognized or undefined roles
        navigate("/dashboard");
      }
    } else {
      // Display the error message if login was unsuccessful
      setError(result.error);
    }
  };

  // Renders the login UI, including the logo, welcome text, error display, and login form
  return (
    <div className="login-container">
      <img src={logo} alt="Logo" className="logo" />
      <div className="background-container">
        <div className="login-card">
          <p className="welcome-text">Welcome!</p>

          {/* Conditionally renders the error message if one exists */}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Username input field — disabled while login is in progress */}
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

            {/* Password input field — disabled while login is in progress */}
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

            {/* Submit button — shows a loading state while the login request is pending */}
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
