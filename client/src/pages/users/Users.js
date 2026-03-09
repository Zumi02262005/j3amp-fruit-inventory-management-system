import React, { useEffect, useState } from "react";
import { userAPI } from "../../services/api";
import "./Users.css";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // for edit modal
  const [status, setStatus] = useState({ type: "", msg: "" });

  const [createForm, setCreateForm] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
    phone: "",
    role: "inbound",
  });

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "",
    status: "",
  });

  const [resetPassword, setResetPassword] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

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
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      status: user.status,
    });
    setResetPassword("");
    setStatus({ type: "", msg: "" });
  };

  const activeUsers = users.filter((u) => u.status === "active");
  const inactiveUsers = users.filter((u) => u.status === "inactive");

  if (loading) return <div className="loader">Loading users...</div>;
  if (error) return <div className="error-bar">{error}</div>;

  return (
    <div className="users-container page-with-navbar">
      <div className="users-header">
        <p className="users-label">Manage Users</p>
        <button className="create-user-btn" onClick={() => setShowCreateForm(true)}>
          + New User
        </button>
      </div>

      {status.msg && (
        <div className={`users-status ${status.type}`}>{status.msg}</div>
      )}

      <div className="users-content">

        {/* Active Users */}
        <div className="users-section active-section">
          <p className="users-section-label">Active Users ({activeUsers.length})</p>
          <div className="user-list">
            {activeUsers.length === 0 ? (
              <div className="user-card"><p><strong>No active users</strong></p></div>
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
                    <button className="user-edit-btn" onClick={() => openEditModal(user)}>
                      Edit
                    </button>
                    <button className="user-deactivate-btn" onClick={() => handleDeactivate(user.user_id)}>
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
                    <button className="user-reactivate-btn" onClick={() => handleReactivate(user.user_id)}>
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
              <div className="modal-input-group">
                <label>Role</label>
                <select name="role" value={createForm.role} onChange={handleCreateChange}>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="modal-submit-btn">Create User</button>
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
                <select name="role" value={editForm.role} onChange={handleEditChange}>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-input-group">
                <label>Status</label>
                <select name="status" value={editForm.status} onChange={handleEditChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <button type="submit" className="modal-submit-btn">Save Changes</button>
            </form>

            {/* Reset Password Section */}
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
                onClick={() => handleResetPassword(selectedUser.user_id)}
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