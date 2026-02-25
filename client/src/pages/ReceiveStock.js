import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ReceiveStock.css'; // We will style this to look like your dashboard

const ReceiveStock = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Form state
    const [formData, setFormData] = useState({
        sku: '',
        quantity: '',
        expiration_date: '',
        supplier_name: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Prepare the data to send to your Backend API
        const submissionData = {
            ...formData,
            received_by: user?.user_id // Automatically gets the ID of the logged-in admin
        };

        try {
            const response = await fetch('http://localhost:5000/api/inventory/receive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData),
            });

            const result = await response.json();

            if (result.success) {
                alert("Success! Stock added to database.");
                navigate('/inventory'); // Go see the new stock
            } else {
                alert("Error: " + result.error);
            }
        } catch (err) {
            console.error("Submission error:", err);
            alert("Failed to connect to the server.");
        }
    };

    return (
        <div className="receive-stock-container">
            <header className="page-header">
                <button onClick={() => navigate('/admin-dashboard')}>← Back</button>
                <h2>Inbound: Receive New Fruit Stock</h2>
            </header>

            <form className="receive-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Product SKU (e.g., AP-01):</label>
                    <input name="sku" value={formData.sku} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label>Weight ($kg$):</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} step="0.01" required />
                </div>

                <div className="form-group">
                    <label>Expiration Date:</label>
                    <input type="date" name="expiration_date" value={formData.expiration_date} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label>Supplier Name:</label>
                    <input name="supplier_name" value={formData.supplier_name} onChange={handleChange} required />
                </div>

                <button type="submit" className="submit-btn">Add to Inventory</button>
            </form>
        </div>
    );
};

export default ReceiveStock;