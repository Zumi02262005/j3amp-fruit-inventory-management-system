import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Inventory.css'; 

const Inventory = () => {
    const [items, setItems] = useState([]);
    const navigate = useNavigate();

    // Fetch data from your Phase 2 Backend API
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/inventory');
                const result = await response.json();
                
                // Note: We check for result.data because our API sends { success: true, data: [...] }
                if (result.success) {
                    setItems(result.data);
                }
            } catch (err) {
                console.error("Failed to load inventory:", err);
            }
        };
        fetchInventory();
    }, []);

    return (
        <div className="inventory-container">
            <header className="page-header">
                <button onClick={() => navigate('/admin-dashboard')} className="back-btn">← Back</button>
                <h1>Current Fruit Inventory</h1>
            </header>

            <table className="inventory-table">
                <thead>
                    <tr>
                        <th>Product Code</th>
                        <th>Fruit Name</th>
                        <th>Supplier</th>
                        <th>Stock Level</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length > 0 ? (
                        items.map((item) => (
                            // Use product_code as the unique key from your SQL
                            <tr key={item.product_code}>
                                <td>{item.product_code}</td>
                                <td>{item.name}</td> 
                                <td>{item.supplier || 'N/A'}</td>
                                <td>{item.stock_level || 0} kg</td>
                                <td className={`status-${item.status?.toLowerCase()}`}>
                                    {item.status}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                No fruit data found. Check your database connections!
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Inventory;