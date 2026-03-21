import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../services/api";
import "./Users.css";
import add_users_icon from "../../assets/icons/manage_users_icon.svg";

/* ── Ripple helper ── */
const useRipple = () => {
  const createRipple = useCallback((e) => {
    const btn = e.currentTarget;
    const circle = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    circle.className = "ripple-circle";
    circle.style.left = `${e.clientX - rect.left}px`;
    circle.style.top  = `${e.clientY - rect.top}px`;
    btn.appendChild(circle);
    circle.addEventListener("animationend", () => circle.remove());
  }, []);
  return createRipple;
};

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [searchQuery, setSearchQuery] = useState("");

  const [createForm, setCreateForm] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
    phone: "",
    role: "inbound",
  });

  const [editForm, setEditForm] = useState({
    username: "",
    full_name: "",
    email: "",
    phone: "",
    role: "",
    status: "",
  });

  const [resetPassword, setResetPassword] = useState("");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [editRoleDropdownOpen, setEditRoleDropdownOpen] = useState(false);
  const [editStatusDropdownOpen, setEditStatusDropdownOpen] = useState(false);

  const createRipple = useRipple();

  const roles = [
    { value: "inbound",  label: "Inbound" },
    { value: "outbound", label: "Outbound" },
    { value: "admin",    label: "Admin" },
  ];

  const statuses = [
    { value: "active",   label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".custom-role-dropdown"))   setRoleDropdownOpen(false);
      if (!e.target.closest(".custom-edit-role-dropdown"))   setEditRoleDropdownOpen(false);
      if (!e.target.closest(".custom-edit-status-dropdown")) setEditStatusDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = showCreateForm || !!selectedUser;
    document.body.style.overflow = isAnyModalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showCreateForm, selectedUser]);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChange = (e) => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", msg: "Creating user..." });
    try {
      await userAPI.createUser(createForm);
      setStatus({ type: "success", msg: "User created successfully!" });
      setCreateForm({ username: "", password: "", full_name: "", email: "", phone: "", role: "inbound" });
      setShowCreateForm(false);
      fetchUsers();
    } catch (err) {
      setStatus({ type: "error", msg: err.response?.data?.message || "Failed to create user." });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", msg: "Saving changes..." });
    try {
      await userAPI.updateUser(selectedUser.user_id, editForm);
      setStatus({ type: "success", msg: "User updated successfully!" });
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setStatus({ type: "error", msg: err.response?.data?.message || "Failed to update user." });
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      await userAPI.deactivateUser(userId);
      fetchUsers();
    } catch (err) {
      setStatus({ type: "error", msg: err.response?.data?.message || "Failed to deactivate user." });
    }
  };

  const handleReactivate = async (userId) => {
    try {
      await userAPI.reactivateUser(userId);
      fetchUsers();
    } catch (err) {
      setStatus({ type: "error", msg: err.response?.data?.message || "Failed to reactivate user." });
    }
  };

  const handleResetPassword = async (userId) => {
    if (!resetPassword) return;
    try {
      await userAPI.resetUserPassword(userId, { new_password: resetPassword });
      setStatus({ type: "success", msg: "Password reset successfully!" });
      setResetPassword("");
      setSelectedUser(null);
    } catch (err) {
      setStatus({ type: "error", msg: err.response?.data?.message || "Failed to reset password." });
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      status: user.status,
    });
    setResetPassword("");
    setStatus({ type: "", msg: "" });
  };

  const filterUsers = (userList) => {
    if (!searchQuery.trim()) return userList;
    const query = searchQuery.toLowerCase();
    return userList.filter((u) => {
      const nameParts = u.full_name.toLowerCase().split(" ");
      return nameParts.some((part) => part.startsWith(query));
    });
  };

  const activeUsers = filterUsers(users.filter((u) => u.status === "active"));
  const inactiveUsers = filterUsers(users.filter((u) => u.status === "inactive"));

  if (loading) return <div className="loader">Loading users...</div>;
  if (error) return <div className="error-bar">{error}</div>;

  return (
    <div className="users-container page-with-navbar">
      <div className="users-header">
        <p className="users-label">Manage Users</p>
      </div>

      {/* Search Bar */}
      <div className="users-search-wrapper">
        <input
          type="text"
          className="users-search-input"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {status.msg && (
        <div className={`users-status ${status.type}`}>{status.msg}</div>
      )}

      <div className="users-content">

        {/* Create User Card */}
        <div className="add-user-actions">
          <button
            className="add-user-card"
            onClick={(e) => { createRipple(e); setShowCreateForm(true); }}
          >
            <img src={add_users_icon} alt="Add User" className="action-icon" />
            <p className="add-user-card-text">+ New User</p>
          </button>
        </div>

        {/* Active Users */}
        <div className="users-section active-section">
          <p className="users-section-label">Active Users ({activeUsers.length})</p>
          <div className="user-list">
            {activeUsers.length === 0 ? (
              <div className="user-card"><p><strong>No active users found</strong></p></div>
            ) : (
              activeUsers.map((user) => (
                <div className="user-card" key={user.user_id}>
                  <div className="user-card-top">
                    <div>
                      <p className="user-name">{user.full_name}</p>
                      <p className="user-username">@{user.username}</p>
                    </div>
                    <span className={`user-role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </div>
                  <ul className="user-details">
                    <li>{user.email}</li>
                    {user.phone && <li>{user.phone}</li>}
                    <li>Last login: {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}</li>
                  </ul>
                  <div className="user-card-actions">
                    <button
                      className="user-view-btn"
                      onClick={(e) => { createRipple(e); navigate(`/users/${user.user_id}`); }}
                    >
                      View Details
                    </button>
                    <button
                      className="user-edit-btn"
                      onClick={(e) => { createRipple(e); openEditModal(user); }}
                    >
                      Edit
                    </button>
                    <button
                      className="user-deactivate-btn"
                      onClick={(e) => { createRipple(e); handleDeactivate(user.user_id); }}
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inactive Users */}
        {inactiveUsers.length > 0 && (
          <div className="users-section inactive-section">
            <p className="users-section-label">Inactive Users ({inactiveUsers.length})</p>
            <div className="user-list">
              {inactiveUsers.map((user) => (
                <div className="user-card inactive-card" key={user.user_id}>
                  <div className="user-card-top">
                    <div>
                      <p className="user-name">{user.full_name}</p>
                      <p className="user-username">@{user.username}</p>
                    </div>
                    <span className={`user-role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </div>
                  <ul className="user-details">
                    <li>{user.email}</li>
                  </ul>
                  <div className="user-card-actions">
                    <button
                      className="user-view-btn"
                      onClick={(e) => { createRipple(e); navigate(`/users/${user.user_id}`); }}
                    >
                      View Details
                    </button>
                    <button
                      className="user-reactivate-btn"
                      onClick={(e) => { createRipple(e); handleReactivate(user.user_id); }}
                    >
                      Reactivate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New User</h3>
              <button className="modal-close" onClick={() => setShowCreateForm(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="modal-form">
              <div className="modal-input-group">
                <label>Username</label>
                <input type="text" name="username" value={createForm.username} onChange={handleCreateChange} required />
              </div>
              <div className="modal-input-group">
                <label>Password</label>
                <input type="password" name="password" value={createForm.password} onChange={handleCreateChange} required />
              </div>
              <div className="modal-input-group">
                <label>Role</label>
                <div className="custom-role-dropdown">
                  <div
                    className={`role-dropdown-selected ${roleDropdownOpen ? "open" : ""}`}
                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  >
                    {roles.find((r) => r.value === createForm.role)?.label || "Select a role"}
                    <span className="role-dropdown-arrow">▾</span>
                  </div>
                  {roleDropdownOpen && (
                    <div className="role-dropdown-list">
                      {roles.map((r) => (
                        <div
                          key={r.value}
                          className={`role-dropdown-item ${createForm.role === r.value ? "selected" : ""}`}
                          onClick={() => {
                            setCreateForm({ ...createForm, role: r.value });
                            setRoleDropdownOpen(false);
                          }}
                        >
                          <span className={`role-dot role-dot-${r.value}`}>●</span>
                          {r.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-input-group">
                <label>Full Name</label>
                <input type="text" name="full_name" value={createForm.full_name} onChange={handleCreateChange} required />
              </div>
              <div className="modal-input-group">
                <label>Email</label>
                <input type="email" name="email" value={createForm.email} onChange={handleCreateChange} required />
              </div>
              <div className="modal-input-group">
                <label>Phone (optional)</label>
                <input type="text" name="phone" value={createForm.phone} onChange={handleCreateChange} />
              </div>
              <button type="submit" className="modal-submit-btn" onClick={createRipple}>
                Create User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit — @{selectedUser.username}</h3>
              <button className="modal-close" onClick={() => setSelectedUser(null)}>✕</button>
            </div>

            {status.msg && (
              <div className={`users-status ${status.type}`}>{status.msg}</div>
            )}

            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="modal-input-group">
                <label>Username</label>
                <input type="text" name="username" value={editForm.username} onChange={handleEditChange} required />
              </div>
              <div className="modal-input-group">
                <label>Full Name</label>
                <input type="text" name="full_name" value={editForm.full_name} onChange={handleEditChange} required />
              </div>
              <div className="modal-input-group">
                <label>Email</label>
                <input type="email" name="email" value={editForm.email} onChange={handleEditChange} required />
              </div>
              <div className="modal-input-group">
                <label>Phone</label>
                <input type="text" name="phone" value={editForm.phone} onChange={handleEditChange} />
              </div>
              <div className="modal-input-group">
                <label>Role</label>
                <div className="custom-edit-role-dropdown">
                  <div
                    className={`role-dropdown-selected ${editRoleDropdownOpen ? "open" : ""}`}
                    onClick={() => setEditRoleDropdownOpen(!editRoleDropdownOpen)}
                  >
                    {roles.find((r) => r.value === editForm.role)?.label || "Select a role"}
                    <span className="role-dropdown-arrow">▾</span>
                  </div>
                  {editRoleDropdownOpen && (
                    <div className="role-dropdown-list">
                      {roles.map((r) => (
                        <div
                          key={r.value}
                          className={`role-dropdown-item ${editForm.role === r.value ? "selected" : ""}`}
                          onClick={() => {
                            setEditForm({ ...editForm, role: r.value });
                            setEditRoleDropdownOpen(false);
                          }}
                        >
                          <span className={`role-dot role-dot-${r.value}`}>●</span>
                          {r.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-input-group">
                <label>Status</label>
                <div className="custom-edit-status-dropdown">
                  <div
                    className={`role-dropdown-selected ${editStatusDropdownOpen ? "open" : ""}`}
                    onClick={() => setEditStatusDropdownOpen(!editStatusDropdownOpen)}
                  >
                    {statuses.find((s) => s.value === editForm.status)?.label || "Select a status"}
                    <span className="role-dropdown-arrow">▾</span>
                  </div>
                  {editStatusDropdownOpen && (
                    <div className="role-dropdown-list">
                      {statuses.map((s) => (
                        <div
                          key={s.value}
                          className={`role-dropdown-item ${editForm.status === s.value ? "selected" : ""}`}
                          onClick={() => {
                            setEditForm({ ...editForm, status: s.value });
                            setEditStatusDropdownOpen(false);
                          }}
                        >
                          <span className={`status-dot status-dot-${s.value}`}>●</span>
                          {s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="modal-submit-btn" onClick={createRipple}>
                Save Changes
              </button>
            </form>

            <div className="modal-divider" />
            <div className="modal-form">
              <div className="modal-input-group">
                <label>Reset Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                />
              </div>
              <button
                className="modal-reset-btn"
                onClick={(e) => { createRipple(e); handleResetPassword(selectedUser.user_id); }}
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;