import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { userAPI } from "../../services/api";
import "./Profile.css";
import profile_icon from "../../assets/icons/profile_icon.svg";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "password"

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [editStatus, setEditStatus] = useState({ type: "", msg: "" });
  const [passwordStatus, setPasswordStatus] = useState({ type: "", msg: "" });

  // Fetch own profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userAPI.getOwnProfile();
        const data = response.data.data;
        setProfile(data);
        setEditForm({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditStatus({ type: "loading", msg: "Saving changes..." });
    try {
      await userAPI.updateOwnProfile(editForm);
      setEditStatus({ type: "success", msg: "Profile updated successfully!" });
      setProfile((prev) => ({ ...prev, ...editForm }));
    } catch (err) {
      setEditStatus({
        type: "error",
        msg: err.response?.data?.message || "Failed to update profile.",
      });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordStatus({ type: "error", msg: "New passwords do not match." });
      return;
    }
    setPasswordStatus({ type: "loading", msg: "Changing password..." });
    try {
      await userAPI.changeOwnPassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordStatus({ type: "success", msg: "Password changed successfully!" });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setPasswordStatus({
        type: "error",
        msg: err.response?.data?.message || "Failed to change password.",
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleBack = () => {
    const role = user?.role;
    if (role === "admin") navigate("/admin-dashboard");
    else if (role === "inbound") navigate("/inbound-dashboard");
    else if (role === "outbound") navigate("/outbound-dashboard");
    else navigate("/login");
  };

  if (loading) {
    return (
      <div className="profile-container page-with-navbar">
        <p className="profile-loading">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container page-with-navbar">
      {/* Header */}
      <div className="profile-header">
        <button className="profile-back-btn" onClick={handleBack}>
          ← Back
        </button>
        <p className="profile-title">Profile</p>
        <button className="profile-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="profile-content">
        {/* Avatar and name */}
        <div className="profile-avatar-section">
          <img src={profile_icon} alt="Profile" className="profile-avatar" />
          <h2 className="profile-full-name">{profile?.full_name}</h2>
          <span className="profile-role-badge">{profile?.role}</span>
          <p className="profile-username">@{profile?.username}</p>
          {profile?.last_login && (
            <p className="profile-last-login">
              Last login: {new Date(profile.last_login).toLocaleString()}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Edit Profile
          </button>
          <button
            className={`profile-tab ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
          >
            Change Password
          </button>
        </div>

        {/* Edit Profile Tab */}
        {activeTab === "profile" && (
          <form className="profile-form" onSubmit={handleEditSubmit}>
            {editStatus.msg && (
              <div className={`profile-status ${editStatus.type}`}>
                {editStatus.msg}
              </div>
            )}
            <div className="profile-input-group">
              <label>System ID (Primary Key)</label>
               <input
                type="text"
                value={`#00${profile?.user_id}`}
                disabled 
                className="readonly-id-input" />
                </div>
            <div className="profile-input-group">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={editForm.full_name}
                onChange={handleEditChange}
                required
              />
            </div>
            <div className="profile-input-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleEditChange}
                required
              />
            </div>
            <div className="profile-input-group">
              <label>Phone</label>
              <input
                type="text"
                name="phone"
                value={editForm.phone}
                onChange={handleEditChange}
                placeholder="Optional"
              />
            </div>
            <button type="submit" className="profile-save-btn">
              Save Changes
            </button>
          </form>
        )}

        {/* Change Password Tab */}
        {activeTab === "password" && (
          <form className="profile-form" onSubmit={handlePasswordSubmit}>
            {passwordStatus.msg && (
              <div className={`profile-status ${passwordStatus.type}`}>
                {passwordStatus.msg}
              </div>
            )}
            <div className="profile-input-group">
              <label>Current Password</label>
              <input
                type="password"
                name="current_password"
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="profile-input-group">
              <label>New Password</label>
              <input
                type="password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="profile-input-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirm_password"
                value={passwordForm.confirm_password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <button type="submit" className="profile-save-btn">
              Change Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;