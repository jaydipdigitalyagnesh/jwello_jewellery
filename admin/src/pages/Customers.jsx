import React, { useState, useEffect } from 'react'
import Aside from '../Common/Aside'

function Customers() {
    const [customers, setCustomers] = useState([])
    const [editCustomer, setEditCustomer] = useState(null)

    const fetchCustomers = () => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/customers`)
            .then(res => res.json())
            .then(data => setCustomers(data.customers))
    }

    useEffect(() => {
        fetchCustomers()
    }, [])

    const deleteCustomer = async (id) => {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/customers/${id}`, {
            method: "DELETE"
        })

        fetchCustomers()
    }

    const updateCustomer = async () => {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/customers/${editCustomer._id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(editCustomer)
        })

        setEditCustomer(null)
        fetchCustomers()
    }

    return (
        <div>
            <Aside />

            <div className="admin-main">
                <main className="admin-content">

                    <h1>Customers</h1>

                    <div className="card">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Role</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {customers.map(customer => (
                                    <tr key={customer._id}>
                                        <td>{customer.name}</td>
                                        <td>{customer.email}</td>
                                        <td>{customer.phone}</td>
                                        <td>{customer.role}</td>

                                        <td>
                                            <div className="customer-action">
                                                <button onClick={() => setEditCustomer(customer)}>
                                                    Edit
                                                </button>

                                                <button onClick={() => {
                                                    const confirmDelete = window.confirm(
                                                        "Are you sure you want to delete this customer?");
                                                    if (confirmDelete) {
                                                        deleteCustomer(customer._id);
                                                    }
                                                }}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Edit Modal */}

                    {editCustomer && (
                        <div className="order-detail-modal open">
                            <div className="odm-box">

                                <input
                                    value={editCustomer.name}
                                    onChange={(e) =>
                                        setEditCustomer({
                                            ...editCustomer,
                                            name: e.target.value
                                        })
                                    }
                                />

                                <input
                                    value={editCustomer.email}
                                    onChange={(e) =>
                                        setEditCustomer({
                                            ...editCustomer,
                                            email: e.target.value
                                        })
                                    }
                                />

                                <input
                                    value={editCustomer.phone}
                                    onChange={(e) =>
                                        setEditCustomer({
                                            ...editCustomer,
                                            phone: e.target.value
                                        })
                                    }
                                />

                                <button onClick={updateCustomer}>
                                    Save
                                </button>

                                <button onClick={() => setEditCustomer(null)}>
                                    Cancel
                                </button>

                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    )
}

export default Customers