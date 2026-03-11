import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Users.css'; // Make sure this file exists in the same folder

const Users = () => {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'inbound', email: '' });

    useEffect(() => { 
        fetchUsers(); 
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/users');
            setUsers(res.data.data);
        } catch (err) { 
            console.error("Error fetching users:", err); 
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/users/add', formData);
            setShowModal(false);
            setFormData({ username: '', password: '', role: 'inbound', email: '' });
            fetchUsers();
        } catch (err) { 
            alert("Error: " + (err.response?.data?.message || err.message)); 
        }
    };

    const toggleStatus = async (user) => {
        const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
        try {
            await axios.put(`http://localhost:5000/api/users/${user.id}`, { ...user, status: newStatus });
            fetchUsers();
        } catch (err) { 
            alert("Error updating status"); 
        }
    };

    return (
        <div className="users-container">
            <div className="page-header">
                <h1>User Management</h1>
                <button className="add-btn" onClick={() => setShowModal(true)}>+ Add New User</button>
            </div>

            <table className="users-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.username}</td>
                            <td className="capitalize">{user.role}</td>
                            <td className={user.status === 'Active' ? 'status-active' : 'status-inactive'}>
                                {user.status}
                            </td>
                            <td>
                                <button className="action-btn" onClick={() => toggleStatus(user)}>
                                    {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay">
                    <form onSubmit={handleAddUser} className="modal-content">
                        <h2>Create New User</h2>
                        <input placeholder="Username" onChange={e => setFormData({...formData, username: e.target.value})} required />
                        <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} required />
                        <select onChange={e => setFormData({...formData, role: e.target.value})}>
                            <option value="inbound">Inbound</option>
                            <option value="outbound">Outbound</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button type="submit">Save</button>
                        <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Users;