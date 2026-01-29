const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");

const Product = require("./models/product");
const Order = require("./models/order");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: "*" } });

app.use(cors({ origin: "*" }));
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1/inventory");

mongoose.connection.once("open", async () => {
  console.log("MongoDB connected");

  if (await Product.countDocuments() === 0) {
    await Product.insertMany([
      { name: "Rice", stock: 50 },
      { name: "Sugar", stock: 40 },
      { name: "Oil", stock: 30 }
    ]);
    console.log("Sample products added");
  }
});

/* ===================== SOCKET ===================== */
io.on("connection", () => console.log("Client connected"));

/* ===================== PRODUCTS ===================== */
app.get("/products", async (req, res) => {
  const role = req.query.role;
  const products = await Product.find();

  if (role === "staff") {
    return res.json(products.map(p => ({ _id: p._id, name: p.name })));
  }

  res.json(products);
});

/* ===================== ORDER ===================== */
app.post("/order", async (req, res) => {
  const { productId, quantity } = req.body;

  if (!quantity || quantity <= 0)
    return res.status(400).json({ message: "Invalid quantity" });

  const product = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { new: true }
  );

  if (!product)
    return res.status(400).json({ message: "Insufficient stock" });

  await Order.create({ product: product.name, quantity });

  io.emit("stockUpdate");

  res.json({ message: "Order placed" });
});

/* ===================== ORDER HISTORY ===================== */
app.get("/orders", async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

/* ===================== ADMIN ADD STOCK ===================== */
app.post("/admin/add-stock", async (req, res) => {
  const { productId, quantity } = req.body;

  if (quantity <= 0)
    return res.status(400).json({ message: "Invalid quantity" });

  const product = await Product.findByIdAndUpdate(
    productId,
    { $inc: { stock: quantity } },
    { new: true }
  );

  io.emit("stockUpdate");
  res.json({ message: "Stock updated" });
});

/* ===================== START SERVER ===================== */
server.listen(5000, () => {
  console.log("Server running on port 5000");
});
