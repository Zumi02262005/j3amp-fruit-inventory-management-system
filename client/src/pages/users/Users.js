// Users.jsx
// This page handles full user management: listing, creating, editing,
// deactivating/reactivating, and resetting passwords for all system users.

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../services/api";
import "./Users.css";
import add_users_icon from "../../assets/icons/manage_users_icon.svg";

//Constants

// Available role options used in both the create and edit forms
const ROLES = [
  { value: "inbound",  label: "Inbound" },
  { value: "outbound", label: "Outbound" },
  { value: "admin",    label: "Admin" },
];

// Available status options used in the edit form
const STATUSES = [
  { value: "active",   label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// Default shape for the create user form
const INITIAL_CREATE_FORM = {
  username: "", password: "", full_name: "", email: "", phone: "", role: "inbound",
};

// Default shape for the edit user form
const INITIAL_EDIT_FORM = {
  username: "", full_name: "", email: "", phone: "", role: "", status: "",
};

//Custom Hook

// Provides a ripple animation effect on button clicks
// Returns a createRipple function to attach to onClick handlers
const useRipple = () =>
  useCallback((e) => {
    const btn = e.currentTarget;
    const circle = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    circle.className = "ripple-circle";
    circle.style.left = `${e.clientX - rect.left}px`;
    circle.style.top  = `${e.clientY - rect.top}px`;
    btn.appendChild(circle);
    circle.addEventListener("animationend", () => circle.remove());
  }, []);

//Reusable Components

// Renders a custom dropdown selector for roles or statuses
// Props: options (array), value (selected), onChange (fn), className (string), dotPrefix (string)
const CustomDropdown = ({ options, value, onChange, className, dotPrefix }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  // Closes the dropdown when clicking outside its container
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${className}`)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [className]);

  return (
    <div className={className}>
      <div
        className={`role-dropdown-selected ${open ? "open" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {selected?.label || "Select..."}
        <span className="role-dropdown-arrow">▾</span>
      </div>
      {open && (
        <div className="role-dropdown-list">
          {options.map((o) => (
            <div
              key={o.value}
              className={`role-dropdown-item ${value === o.value ? "selected" : ""}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              <span className={`${dotPrefix}-dot ${dotPrefix}-dot-${o.value}`}>●</span>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Renders a single user card with action buttons
// Props: user (object), onView, onEdit, onDeactivate, onReactivate (fns), createRipple (fn)
const UserCard = ({ user, onView, onEdit, onDeactivate, onReactivate, createRipple }) => (
  <div className={`user-card ${user.status === "inactive" ? "inactive-card" : ""}`} key={user.user_id}>
    <div className="user-card-top">
      <div>
        <p className="user-name">{user.full_name}</p>
        <p className="user-username">@{user.username}</p>
      </div>
      <span className={`user-role-badge role-${user.role}`}>{user.role}</span>
    </div>

    <ul className="user-details">
      <li>{user.email}</li>
      {/* Only show phone and last login for active users */}
      {user.status === "active" && (
        <>
          {user.phone && <li>{user.phone}</li>}
          <li>Last login: {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}</li>
        </>
      )}
    </ul>

    <div className="user-card-actions">
      <button className="user-view-btn" onClick={(e) => { createRipple(e); onView(); }}>View Details</button>
      {/* Show Edit + Deactivate for active users, Reactivate for inactive */}
      {user.status === "active" ? (
        <>
          <button className="user-edit-btn" onClick={(e) => { createRipple(e); onEdit(); }}>Edit</button>
          <button className="user-deactivate-btn" onClick={(e) => { createRipple(e); onDeactivate(); }}>Deactivate</button>
        </>
      ) : (
        <button className="user-reactivate-btn" onClick={(e) => { createRipple(e); onReactivate(); }}>Reactivate</button>
      )}
    </div>
  </div>
);

//Main Component

const Users = () => {
  const navigate = useNavigate();
  const createRipple = useRipple();

  // Core data states
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Feedback state: type can be "loading", "success", or "error"
  const [status, setStatus] = useState({ type: "", msg: "" });

  // Modal visibility: showCreateForm toggles the create modal, selectedUser drives the edit modal
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser]     = useState(null);

  // Controlled form states for creating and editing users
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
  const [editForm, setEditForm]     = useState(INITIAL_EDIT_FORM);

  // Password value used in the reset password section of the edit modal
  const [resetPassword, setResetPassword] = useState("");

  // Locks background scroll whenever any modal is open
  useEffect(() => {
    document.body.style.overflow = (showCreateForm || !!selectedUser) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showCreateForm, selectedUser]);

  // Fetches all users from the API on initial mount
  useEffect(() => { fetchUsers(); }, []);

  // Retrieves the full user list and updates state; sets error if the request fails
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

  // Generic change handler for both create and edit forms
  // Uses the input's name attribute to update the correct field
  const makeChangeHandler = (setForm) => (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // Submits the create form to the API, resets the form, and refreshes the user list on success
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", msg: "Creating user..." });
    try {
      await userAPI.createUser(createForm);
      setStatus({ type: "success", msg: "User created successfully!" });
      setCreateForm(INITIAL_CREATE_FORM);
      setShowCreateForm(false);
      fetchUsers();
    } catch (err) {
      setStatus({ type: "error", msg: err.response?.data?.message || "Failed to create user." });
    }
  };

  // Submits the edit form to the API and refreshes the user list on success
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

  // Sends a deactivate or reactivate request based on the provided action string
  // Refreshes the user list on success; sets error status on failure
  const handleToggleStatus = async (userId, action) => {
    try {
      await (action === "deactivate" ? userAPI.deactivateUser(userId) : userAPI.reactivateUser(userId));
      fetchUsers();
    } catch (err) {
      setStatus({ type: "error", msg: err.response?.data?.message || `Failed to ${action} user.` });
    }
  };

  // Submits a password reset request for the selected user
  // Clears the password input and closes the modal on success
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

  // Opens the edit modal and pre-populates the edit form with the selected user's current data
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      username:  user.username,
      full_name: user.full_name,
      email:     user.email,
      phone:     user.phone || "",
      role:      user.role,
      status:    user.status,
    });
    setResetPassword("");
    setStatus({ type: "", msg: "" });
  };

  // Filters a user list by matching the search query against the start of any name part
  const filterUsers = (userList) => {
    if (!searchQuery.trim()) return userList;
    const query = searchQuery.toLowerCase();
    return userList.filter((u) =>
      u.full_name.toLowerCase().split(" ").some((part) => part.startsWith(query))
    );
  };

  // Pre-filtered and separated lists for active and inactive users
  const activeUsers   = filterUsers(users.filter((u) => u.status === "active"));
  const inactiveUsers = filterUsers(users.filter((u) => u.status === "inactive"));

  if (loading) return <div className="loader">Loading users...</div>;
  if (error)   return <div className="error-bar">{error}</div>;

  return (
    <div className="users-container page-with-navbar">
      <div className="users-header">
        <p className="users-label">Manage Users</p>
      </div>

      {/* Search bar — filters both active and inactive user lists in real time */}
      <div className="users-search-wrapper">
        <input
          type="text"
          className="users-search-input"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Global status feedback banner — shown for loading, success, or error states */}
      {status.msg && <div className={`users-status ${status.type}`}>{status.msg}</div>}

      <div className="users-content">

        {/* Button card that opens the Create User modal */}
        <div className="add-user-actions">
          <button className="add-user-card" onClick={(e) => { createRipple(e); setShowCreateForm(true); }}>
            <img src={add_users_icon} alt="Add User" className="action-icon" />
            <p className="add-user-card-text">New User</p>
          </button>
        </div>

        {/* Active users section — renders a UserCard for each active user */}
        <div className="users-section active-section">
          <p className="users-section-label">Active Users ({activeUsers.length})</p>
          <div className="user-list">
            {activeUsers.length === 0 ? (
              <div className="user-card"><p><strong>No active users found</strong></p></div>
            ) : (
              activeUsers.map((user) => (
                <UserCard
                  key={user.user_id}
                  user={user}
                  createRipple={createRipple}
                  onView={() => navigate(`/users/${user.user_id}`)}
                  onEdit={() => openEditModal(user)}
                  onDeactivate={() => handleToggleStatus(user.user_id, "deactivate")}
                />
              ))
            )}
          </div>
        </div>

        {/* Inactive users section — only rendered if inactive users exist */}
        {inactiveUsers.length > 0 && (
          <div className="users-section inactive-section">
            <p className="users-section-label">Inactive Users ({inactiveUsers.length})</p>
            <div className="user-list">
              {inactiveUsers.map((user) => (
                <UserCard
                  key={user.user_id}
                  user={user}
                  createRipple={createRipple}
                  onView={() => navigate(`/users/${user.user_id}`)}
                  onReactivate={() => handleToggleStatus(user.user_id, "reactivate")}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/*Create User Modal*/}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New User</h3>
              <button className="modal-close" onClick={() => setShowCreateForm(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="modal-form">
              {[
                { label: "Username", name: "username", type: "text" },
                { label: "Password", name: "password", type: "password" },
                { label: "Full Name", name: "full_name", type: "text" },
                { label: "Email", name: "email", type: "email" },
                { label: "Phone (optional)", name: "phone", type: "text", required: false },
              ].map(({ label, name, type, required = true }) => (
                <div className="modal-input-group" key={name}>
                  <label>{label}</label>
                  <input
                    type={type}
                    name={name}
                    value={createForm[name]}
                    onChange={makeChangeHandler(setCreateForm)}
                    required={required}
                  />
                </div>
              ))}

              {/* Role dropdown for the create form */}
              <div className="modal-input-group">
                <label>Role</label>
                <CustomDropdown
                  options={ROLES}
                  value={createForm.role}
                  onChange={(val) => setCreateForm((prev) => ({ ...prev, role: val }))}
                  className="custom-role-dropdown"
                  dotPrefix="role"
                />
              </div>
              <button type="submit" className="modal-submit-btn" onClick={createRipple}>
                Create User
              </button>
            </form>
          </div>
        </div>
      )}

      {/*Edit User Modal*/}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit — @{selectedUser.username}</h3>
              <button className="modal-close" onClick={() => setSelectedUser(null)}>✕</button>
            </div>

            {/* Status banner scoped inside the edit modal for inline feedback */}
            {status.msg && <div className={`users-status ${status.type}`}>{status.msg}</div>}

            <form onSubmit={handleEditSubmit} className="modal-form">
              {[
                { label: "Username",  name: "username",  type: "text" },
                { label: "Full Name", name: "full_name", type: "text" },
                { label: "Email",     name: "email",     type: "email" },
                { label: "Phone",     name: "phone",     type: "text", required: false },
              ].map(({ label, name, type, required = true }) => (
                <div className="modal-input-group" key={name}>
                  <label>{label}</label>
                  <input
                    type={type}
                    name={name}
                    value={editForm[name]}
                    onChange={makeChangeHandler(setEditForm)}
                    required={required}
                  />
                </div>
              ))}

              {/* Role and Status dropdowns for the edit form */}
              <div className="modal-input-group">
                <label>Role</label>
                <CustomDropdown
                  options={ROLES}
                  value={editForm.role}
                  onChange={(val) => setEditForm((prev) => ({ ...prev, role: val }))}
                  className="custom-edit-role-dropdown"
                  dotPrefix="role"
                />
              </div>
              <div className="modal-input-group">
                <label>Status</label>
                <CustomDropdown
                  options={STATUSES}
                  value={editForm.status}
                  onChange={(val) => setEditForm((prev) => ({ ...prev, status: val }))}
                  className="custom-edit-status-dropdown"
                  dotPrefix="status"
                />
              </div>
              <button type="submit" className="modal-submit-btn" onClick={createRipple}>
                Save Changes
              </button>
            </form>

            {/* Divider separating the edit form from the password reset section */}
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