import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ReceiveStock.css'; 

const RecieveStock = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Form state updated to match Railway SQL column names
    const [formData, setFormData] = useState({
        product_code: '', // Matches 'product_code' in your SQL
        quantity: '',
        batch_number: '', // New field required by your SQL
        expiry_date: '',  // Matches 'expiry_date' in your SQL
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
            user_id: user?.id || 'admin' // Matches 'user_id' in your activity_logs table
        };

        try {
            const response = await fetch('http://localhost:5000/api/inventory/receive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData),
            });

            const result = await response.json();

            if (result.success) {
                alert("Success! Stock added and activity logged.");
                navigate('/inventory'); 
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
                <button onClick={() => navigate('/admin-dashboard')} className="back-btn">← Back</button>
                <h2>Inbound: Receive New Fruit Stock</h2>
            </header>

            <form className="receive-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Product Code (e.g., APP-01):</label>
                    <input 
                        name="product_code" 
                        value={formData.product_code} 
                        onChange={handleChange} 
                        placeholder="Must match a code in Inventory table"
                        required 
                    />
                </div>

                <div className="form-group">
                    <label>Batch Number:</label>
                    <input 
                        name="batch_number" 
                        value={formData.batch_number} 
                        onChange={handleChange} 
                        placeholder="e.g., BATCH-101"
                        required 
                    />
                </div>

                <div className="form-group">
                    <label>Weight (kg):</label>
                    <input 
                        type="number" 
                        name="quantity" 
                        value={formData.quantity} 
                        onChange={handleChange} 
                        step="0.01" 
                        required 
                    />
                </div>

                <div className="form-group">
                    <label>Expiry Date:</label>
                    <input 
                        type="date" 
                        name="expiry_date" 
                        value={formData.expiry_date} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className="form-group">
                    <label>Supplier Name:</label>
                    <input 
                        name="supplier_name" 
                        value={formData.supplier_name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <button type="submit" className="submit-btn">Add to Inventory</button>
            </form>
        </div>
    );
};

export default RecieveStock;