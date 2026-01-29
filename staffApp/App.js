import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function App() {
  const [products, setProducts] = useState([]);
  const [qty, setQty] = useState({});

  const loadProducts = async () => {
    const res = await axios.get(
      "http://localhost:5000/products?role=staff"
    );
    setProducts(res.data);
  };

  useEffect(() => {
    loadProducts();
    socket.on("stockUpdate", loadProducts);
    return () => socket.off("stockUpdate");
  }, []);

  const order = async (id) => {
    try {
      await axios.post("http://localhost:5000/order", {
        productId: id,
        quantity: Number(qty[id])
      });
      alert("Order placed successfully");
      setQty({});
    } catch (err) {
      alert(err.response?.data?.message || "Server error");
    }
  };

  return (
    <div>
      <h2>🧑‍💼 Staff Panel</h2>

      {products.map(p => (
        <div key={p._id}>
          <b>{p.name}</b>
          <input
            type="number"
            placeholder="Quantity"
            value={qty[p._id] || ""}
            onChange={e =>
              setQty(prev => ({ ...prev, [p._id]: e.target.value }))
            }
          />
          <button onClick={() => order(p._id)}>Order</button>
        </div>
      ))}
    </div>
  );
}
