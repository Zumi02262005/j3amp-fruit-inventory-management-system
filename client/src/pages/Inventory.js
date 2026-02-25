import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Inventory.css'; // Create this for styling

const Inventory = () => {
    const [items, setItems] = useState([]);
    const navigate = useNavigate();

    // Fetch data from your Phase 2 Backend API
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/inventory');
                const data = await response.json();
                setItems(data);
            } catch (err) {
                console.error("Failed to load inventory:", err);
            }
        };
        fetchInventory();
    }, []);

    return (
        <div className="inventory-container">
            <header>
                <button onClick={() => navigate('/admin-dashboard')}>← Back</button>
                <h1>Current Fruit Inventory</h1>
            </header>

            <table className="inventory-table">
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Supplier</th>
                        <th>Stock Level</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length > 0 ? (
                        items.map((item) => (
                            <tr key={item.sku}>
                                <td>{item.sku}</td>
                                <td>{item.product_name}</td>
                                <td>{item.supplier}</td>
                                <td>{item.total_weight} kg</td>
                                <td className={`status-${item.status}`}>{item.status}</td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="5">No fruit data found. Run your SQL script!</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Inventory;