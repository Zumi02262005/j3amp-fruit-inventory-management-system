import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';
import logo from '../assets/icons/logo.svg';

const Login = () => {
  const [username, setUsername] = useState('');  // ✅ Changed from email
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(username, password);
      setLoading(false);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setLoading(false);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Logo" className="logo"/>
      <div className="background-container">
        <svg className="login-background-2"width="353" height="549" viewBox="0 0 353 549" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M116 0C49.6 0 11 35.6667 0 53.5V549H391.5V18C380.833 29.6667 344.7 53.5 285.5 53.5C211.5 53.5 199 0 116 0Z" fill="#FF8C45"/>
        </svg>
        <svg className="login-background-1" width="390" height="549" viewBox="0 0 390 549" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M115.5 0C49.1 0 10.5 35.6667 -0.5 53.5V549H391V18C380.333 29.6667 344.2 53.5 285 53.5C211 53.5 198.5 0 115.5 0Z" fill="white"/>
        </svg>
        <div className="login-card">
        <p className="welcome-text">Welcome!</p>
        <div className="error-message" style={{ visibility: error ? 'visible' : 'hidden' }}>
          {error || 'placeholder'}
        </div>

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
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>

      {/*
        <div className="login-card">
          <div className="logo-container">
            <div className="logo">🍊</div>
          </div>

          <h1 className="welcome-text">Welcome!</h1>

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
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="login-footer">
            <p className="new-user">
              New User? <span className="signup-link">Sign Up</span>
            </p>
          </div>
        </div>
      */}
    </div>
  );
};

export default Login;