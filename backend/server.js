import mongoose from "mongoose";
import cors from "cors";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import Product from "./models/Product.js"
import Coupon from "./models/Coupon.js";
import ProductReview from "./models/ProductReview.js";
import UserReview from "./models/UserReview.js";
import jwt from "jsonwebtoken";
import express from "express";
import bcrypt from "bcryptjs";
dotenv.config();
const app = express();
const PORT = process.env.PORT
app.use(cors({
  origin: "*"
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});
/* Razorpay */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* MongoDB */
mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Mongo Error:", err));

/* User Schema */
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  role: {
    type: String,
    default: "user"
  },
  addresses: [
    {
      fullName: String,
      phone: String,
      altPhone: String,
      address: String,
      city: String
    }
  ]
});
const User = mongoose.model("User", userSchema);

/* Order Schema */
const orderSchema = new mongoose.Schema({
  name: String,
  products: Array,
  amount: Number,
  customer: String,
  email: String, address: Object,

  status: {
    type: String,
    default: "Pending"
  },

  deliveryStatus: {
    type: String,
    default: "Processing"
  },

  refundStatus: {
    type: String,
    default: "Not Refunded"
  },
  deliveredAt: Date,
  paymentId: String,
  razorpayOrderId: String,

  date: {
    type: Date,
    default: Date.now
  }
});
const Order = mongoose.model("Order", orderSchema);

/* 📌 NEW BOOKING SCHEMA */
const bookingSchema = new mongoose.Schema({
  productName: String,
  price: Number,
  email: String,
  date: {
    type: Date,
    default: Date.now
  }
});
const Booking = mongoose.model("Booking", bookingSchema);
const categorySchema = new mongoose.Schema({
  name: String,
  image: String,
  count: Number
})
const Category = mongoose.model("Category", categorySchema)
const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  metal: String,
  price: Number,
  stock: Number,

  salesCount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    default: "in-stock"
  },

  images: [String]
})

/* Register */
app.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.json({
        success: false,
        message: "Email already exists"
      });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.json({
        success: false,
        message: "Phone number already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "user"
    });

    await user.save();

    res.json({
      success: true,
      message: "Registered successfully"
    });

  } catch (err) {
    res.json({
      success: false,
      message: err.errors
        ? Object.values(err.errors)[0].message
        : err.message
    });
  }
});
/* User Login */

app.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid credentials"
      });
    }

    let isMatch = false;

    // User already has hashed password
    if (user.password.startsWith("$2")) {

      isMatch = await bcrypt.compare(
        password,
        user.password
      );

    } else {

      // Old plain-text password
      isMatch = user.password === password;

      // Automatically convert to bcrypt hash
      if (isMatch) {

        user.password = await bcrypt.hash(password, 10);

        await user.save();

        console.log("Password migrated:", user.email);

      }

    }

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }

});

/* Admin Login */
app.post("/admin-login", async (req, res) => {
  try {
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    // Find admin by email
    const admin = await User.findOne({ email });

    if (!admin) {
      return res.json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check role
    if (admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Admin access denied"
      });
    }

    let isMatch = false;

    // If password is already hashed
    if (admin.password.startsWith("$2")) {

      isMatch = await bcrypt.compare(
        password,
        admin.password
      );

    } else {

      // Old plain-text password
      isMatch = admin.password === password;

      // Automatically convert to bcrypt hash
      if (isMatch) {

        admin.password = await bcrypt.hash(password, 10);

        await admin.save();

        console.log(`✅ Admin password migrated: ${admin.email}`);

      }

    }

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    // Success response
    res.json({
      success: true,
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
});
/* Razorpay Order */
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: "order_rcptid_" + Date.now()
    };

    const order = await razorpay.orders.create(options);

    console.log("RAZORPAY ORDER:", order);

    res.json(order); // ✅ RETURN FULL OBJECT

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Order creation failed" });
  }
});
/* Save Order Pending */
app.post("/save-order", async (req, res) => {
  try {

    const order = new Order({
      name: req.body.name,
      products: req.body.products,
      amount: req.body.amount,
      customer: req.body.customer,
      email: req.body.email,
      address: req.body.address,
      status: req.body.status,
      deliveryStatus: "Processing"
    });

    await order.save();

    res.json(order);

  } catch (err) {
    res.json({ success: false });
  }
});
/* 📌 NEW SAVE BOOKING ROUTE */
app.post("/save-booking", async (req, res) => {
  try {
    const booking = new Booking({
      productName: req.body.productName,
      price: req.body.price,
      email: req.body.email
    });

    await booking.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.post("/update-order", async (req, res) => {
  try {
    const { id, paymentId, razorpayOrderId, status } = req.body;

    let updateData = {};

    // 🔥 NORMALIZE STATUS (SAFE LOGIC)
    const normalizedStatus = status?.toLowerCase();

    if (normalizedStatus === "failed") {
      updateData.status = "Failed";
    }
    else if (normalizedStatus === "pending") {
      updateData.status = "Pending";
    }
    const existingOrder = await Order.findById(id);

    if (
      existingOrder &&
      existingOrder.status === "Paid"
    ) {

      return res.json({
        success: true,
        message: "Order already paid"
      });

    }
    else if (normalizedStatus === "paid") {

      updateData.status = "Paid";

      const order = await Order.findById(id);

      if (existingOrder) {

        for (const item of existingOrder.products) {

          const product =
            await Product.findById(item._id);

          if (!product) continue;

          // prevent negative stock
          if (product.stock < (item.qty || 1)) {

            return res.status(400).json({
              success: false,
              message: `${product.name} out of stock`
            });

          }

          await Product.findByIdAndUpdate(
            item._id,
            {
              $inc: {
                salesCount: item.qty || 1,
                stock: -(item.qty || 1)
              }
            }
          );

        }

      }

    }
    else {
      // fallback (safety)
      updateData.status = "Pending";
    }

    // ✅ ONLY FETCH PAYMENT DETAILS IF PAID
    if (updateData.status === "Paid" && paymentId) {
      updateData.paymentId = paymentId;
      updateData.razorpayOrderId = razorpayOrderId;

      const payment = await razorpay.payments.fetch(paymentId);

      updateData.paymentMethod = payment.method;        // upi / card / wallet
      updateData.bank = payment.bank || "";
      updateData.wallet = payment.wallet || "";
      updateData.vpa = payment.vpa || "";
      updateData.cardType = payment.card?.network || "";
    }

    await Order.findByIdAndUpdate(id, updateData);

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
});
app.put("/update-delivery-status/:id", async (req, res) => {

  try {

    const { deliveryStatus } =
      req.body;

    const updateData = {
      deliveryStatus
    };

    if (
      deliveryStatus === "Delivered"
    ) {

      updateData.deliveredAt =
        new Date();

    }

    await Order.findByIdAndUpdate(
      req.params.id,
      updateData
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false
    });

  }

}
);
/* 📌 NEW USER BOOKINGS ONLY */
app.get("/my-bookings/:email", async (req, res) => {
  try {
    const bookings = await Booking.find({ email: req.params.email });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

/* Dashboard Stats */
app.get("/dashboard-stats", async (req, res) => {

  const totalOrders = await Order.countDocuments();

  const totalRevenueData = await Order.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" }
      }
    }
  ]);

  const totalCustomers = await User.countDocuments();

  const totalProducts = await Product.countDocuments();

  // ✅ RETURNED ORDERS
  const returnedOrders = await Order.countDocuments({
    deliveryStatus: "Returned"
  });

  // ✅ REFUNDED ORDERS
  const refundedOrders = await Order.countDocuments({
    refundStatus: "Refunded"
  });

  // ✅ REVIEWS
  const reviews = await ProductReview.find();

  const avgRating =
    reviews.length > 0
      ? (
        reviews.reduce(
          (sum, r) => sum + r.rating,
          0
        ) / reviews.length
      ).toFixed(1)
      : 0;
  // ✅ RETURN RATE
  const returnRate =
    totalOrders > 0
      ? ((returnedOrders / totalOrders) * 100).toFixed(1)
      : 0;

  // ✅ REFUND RATE
  const refundRate =
    totalOrders > 0
      ? ((refundedOrders / totalOrders) * 100).toFixed(1)
      : 0;

  res.json({
    totalRevenue: totalRevenueData[0]?.total || 0,
    totalOrders,
    totalCustomers,
    totalProducts,
    returnRate,
    refundRate,
    avgRating
  });

});
/* Customers */
app.get("/customers", async (req, res) => {
  const customers = await User.find({ role: "user" });

  res.json({ customers });
});

app.delete("/customers/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);

  res.json({ success: true });
});
app.delete("/delete-order/:id", async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);

    if (deleted) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});

app.get("/categories-count", async (req, res) => {
  try {

    const categories = await Category.find()
    const products = await Product.find()

    const result = categories.map(cat => ({

      _id: cat._id,
      name: cat.name,
      image: cat.image,

      count: products.filter(
        p =>
          p.category?.toLowerCase().trim() ===
          cat.name?.toLowerCase().trim()
      ).length

    }))

    res.json({
      success: true,
      categories: result
    })

  } catch (err) {

    console.log(err)

    res.status(500).json({
      success: false,
      message: "Server Error"
    })
  }
})

app.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find()
    res.json(categories)
  } catch (err) {
    console.log(err)
    res.json([])
  }
})

app.post("/categories", async (req, res) => {
  try {
    const category = new Category(req.body)
    await category.save()
    res.json({ success: true })
  } catch (err) {
    console.log(err)
    res.json({ success: false })
  }
})
app.get("/products", async (req, res) => {

  try {

    const products = await Product.find()

    res.json(products)

  } catch (err) {

    console.log(err)

    res.status(500).json({
      error: err.message
    })
  }

});
app.put("/categories/:id", async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, req.body)
    res.json({ success: true })
  } catch (err) {
    res.json({ success: false })
  }
})

app.delete("/categories/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.json({ success: false })
  }
})
app.get("/orders/:email", async (req, res) => {
  try {
    const orders = await Order.find({
      email: req.params.email
    }).sort({ date: -1 });

    res.json({ orders });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/save-address", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // ✅ validation
    if (!req.body.fullName || !req.body.phone || !req.body.address) {
      return res.json({ success: false, message: "Missing fields" });
    }

    // ✅ new address
    const newAddr = {
      fullName: req.body.fullName,
      phone: req.body.phone,
      altPhone: req.body.altPhone,
      address: req.body.address,
      city: req.body.city
    };

    // ✅ prevent duplicate
    const exists = user.addresses.some(
      (a) => a.address === newAddr.address && a.phone === newAddr.phone
    );

    if (!exists) {
      user.addresses.push(newAddr);
    }

    await user.save();

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});
app.get("/get-user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    res.json(user);
  } catch (err) {
    res.json({ success: false });
  }
});
app.post("/delete-address", async (req, res) => {
  try {
    console.log("EMAIL:", req.body.email);
    console.log("DELETE ID:", req.body.id);

    const user = await User.findOne({ email: req.body.email.trim() });

    if (!user) {
      console.log("User not found ❌");
      return res.json({ success: false });
    }

    console.log("Before:", user.addresses.length);

    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== String(req.body.id)
    );

    console.log("After:", user.addresses.length);

    await user.save();

    res.json({ success: true });

  } catch (err) {
    console.log("ERROR:", err);
    res.json({ success: false });
  }
});
app.post("/update-address", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email.trim() });

    if (!user) {
      return res.json({ success: false });
    }

    const addr = user.addresses.id(req.body.id);

    if (!addr) {
      return res.json({ success: false });
    }

    addr.fullName = req.body.fullName;
    addr.phone = req.body.phone;
    addr.altPhone = req.body.altPhone;
    addr.address = req.body.address;

    await user.save();

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});

app.post("/payment/retry/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    // ❌ Order not found
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ❌ Already paid
    if (order.status === "Paid") {
      return res.status(400).json({ message: "Already paid" });
    }

    // 🔐 Optional security (recommended)
    // if (order.email !== req.body.email) {
    //   return res.status(403).json({ message: "Unauthorized" });
    // }
    console.log("ORDER:", order);
    console.log("AMOUNT:", order.amount);
    // ✅ Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Number(order.amount) * 100,
      currency: "INR",
      receipt: order._id.toString(),
    });

    // ✅ Send response
    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
    });

  } catch (err) {
    console.log("Retry Payment Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      orders: orders
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/get-orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/update-delivery", async (req, res) => {
  try {

    const { id, status } = req.body;

    console.log("ID:", id);
    console.log("STATUS:", status);

    const updateData = {
      deliveryStatus: status
    };

    if (status === "Delivered") {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        $set: updateData
      },
      {
        new: true
      }
    );

    console.log("UPDATED ORDER:", updatedOrder);

    io.emit("delivery-updated", { id, status });

    res.json({
      success: true,
      updatedOrder
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: err.message
    });
  }
});
app.post("/products", async (req, res) => {

  try {

    const product = new Product(req.body)

    await product.save()

    res.json({
      success: true,
      product
    })

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    })

  }

})
app.put("/products/:id", async (req, res) => {

  try {

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )

    res.json({
      success: true,
      product
    })

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    })

  }

})
app.delete("/products/:id", async (req, res) => {

  try {

    await Product.findByIdAndDelete(req.params.id)

    res.json({
      success: true
    })

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    })

  }

})
app.get("/coupons", async (req, res) => {
  const coupons = await Coupon.find();
  res.json(coupons);
});

app.post("/coupons", async (req, res) => {
  const coupon = new Coupon(req.body);
  await coupon.save();
  res.json(coupon);
});

app.delete("/coupons/:id", async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
app.put("/coupons/:id", async (req, res) => {
  try {

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      coupon: updatedCoupon
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false
    });

  }
});
app.get("/reports-data", async (req, res) => {
  try {

    const orders = await Order.find();
    const products = await Product.find();

    // ✅ CITY REVENUE
    const cityData = await Order.aggregate([
      {
        $match: {
          "address.city": { $exists: true, $ne: "" }
        }
      },
      {
        $group: {
          _id: { $toUpper: "$address.city" },
          totalRevenue: { $sum: "$amount" }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    // ✅ TOTAL REVENUE
    const totalRevenue = orders.reduce(
      (sum, o) => sum + (o.amount || 0),
      0
    );

    // ✅ TOTAL ORDERS
    const totalOrders = orders.length;

    // ✅ RETURNED ORDERS
    const returnedOrders = orders.filter(
      o => o.deliveryStatus === "Returned"
    ).length;

    // ✅ REFUNDED ORDERS
    const refundedOrders = orders.filter(
      o => o.refundStatus === "Refunded"
    ).length;

    // ✅ RETURN RATE
    const returnRate =
      totalOrders > 0
        ? ((returnedOrders / totalOrders) * 100).toFixed(1)
        : 0;

    // ✅ REFUND RATE
    const refundRate =
      totalOrders > 0
        ? ((refundedOrders / totalOrders) * 100).toFixed(1)
        : 0;

    // ✅ AVG RATING
    const reviews = await ProductReview.find();

    const avgRating =
      reviews.length > 0
        ? (
          reviews.reduce(
            (sum, r) => sum + r.rating,
            0
          ) / reviews.length
        ).toFixed(1)
        : 0;

    // ✅ MONTHLY REVENUE
    const monthlyRevenue = [0, 0, 0, 0, 0, 0];

    orders.forEach(order => {
      const month = new Date(order.date).getMonth();

      if (month <= 5) {
        monthlyRevenue[month] += order.amount || 0;
      }
    });

    // ✅ CATEGORY SALES
    const categoryMap = {};

    products.forEach(p => {

      if (!categoryMap[p.category]) {
        categoryMap[p.category] = 0;
      }

      categoryMap[p.category] += p.salesCount || 0;

    });

    // ✅ TOP PRODUCTS
    const topProducts = [...products]
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5);

    // ✅ RESPONSE
    res.json({
      success: true,
      totalRevenue,
      totalOrders,
      returnRate,
      refundRate,
      avgRating,

      avgOrder:
        totalOrders > 0
          ? (totalRevenue / totalOrders).toFixed(2)
          : 0,

      monthlyRevenue,
      categoryLabels: Object.keys(categoryMap),
      categorySales: Object.values(categoryMap),
      topProducts,
      topCities: cityData
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false
    });

  }
});
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    res.json(product);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
const cartSchema = new mongoose.Schema({
  email: String,
  productId: String,
  quantity: Number
});

const Cart = mongoose.model("Cart", cartSchema);

app.post("/cart/add", async (req, res) => {

  try {

    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);

    if (!product) { return res.status(404).json({ success: false, message: "Product not found" }); }

    res.json({ success: true, product: { ...product._doc, quantity } });

  } catch (err) {

    console.log(err);

    res.status(500).json({ success: false });

  }

});
app.post("/product-reviews", async (req, res) => {

  try {
    const { productId, orderId, userEmail, userName, rating, comment } = req.body;

    const order = await Order.findOne({ _id: orderId, email: userEmail, deliveryStatus: "Delivered", "products._id": productId });

    if (!order) { return res.status(400).json({ success: false, message: "Review allowed only after delivery" }); }

    const existingReview = await ProductReview.findOne({ productId, userEmail });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message:
          "You already reviewed this product"
      });
    }
    await ProductReview.create({
      productId,
      orderId,
      userEmail,
      userName,
      rating,
      comment
    });

    const reviews = await ProductReview.find({ productId });

    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, { ratings: { average: avg, count: reviews.length } });

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false
    });
  }
});
app.put("/product-reviews/:id", async (req, res) => {

  try {

    await ProductReview.findByIdAndUpdate(
      req.params.id,
      {
        rating: req.body.rating,
        comment: req.body.comment
      }
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false
    });

  }

});
app.get("/product-reviews/:productId", async (req, res) => {

  try {

    const reviews =
      await ProductReview.find({
        productId:
          req.params.productId
      }).sort({
        createdAt: -1
      });
    res.json(reviews);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false
    });

  }

});
app.get("/can-review/:productId/:email",
  async (req, res) => {

    try {

      const {
        productId,
        email
      } = req.params;

      const order =
        await Order.findOne({

          email,

          deliveryStatus:
            "Delivered",

          "products._id":
            productId

        });

      if (!order) {

        return res.json({
          canReview: false
        });

      }

      const existingReview =
        await ProductReview.findOne({

          productId,

          userEmail: email

        });

      res.json({

        canReview: !existingReview,

        orderId: order._id

      });

    } catch (err) {

      console.log(err);

      res.json({
        canReview: false
      });

    }

  }
);

app.post("/user-reviews", async (req, res) => {

  try {
    await UserReview.create(req.body);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
});
app.put("/user-reviews/:id", async (req, res) => {

  try {

    await UserReview.findByIdAndUpdate(
      req.params.id,
      {
        rating: req.body.rating,
        comment: req.body.comment
      }
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false
    });

  }

});
app.get("/user-reviews/:email", async (req, res) => {

  try {
    const reviews = await UserReview.find({
      userEmail: req.params.email
    });
    res.json(reviews);
  } catch (err) {
    console.log(err);
    res.status(500).json([]);
  }

});
app.get("/coupons/:code", async (req, res) => {

  try {
    const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase(), active: true });

    if (!coupon) {

      return res.json({
        success: false
      });

    }

    res.json({
      success: true,
      data: coupon
    });

  } catch (err) {

    console.log(err);

    res.json({
      success: false
    });

  }

});
app.get("/top-products", async (req, res) => {

  try {

    const products =
      await Product.find()
        .sort({ salesCount: -1 })
        .limit(5);

    res.json(products);

  } catch (err) {

    res.status(500).json({
      message: "Error fetching top products"
    });

  }

});
/* Start */
server.listen(PORT, () => {
  console.log("Server running ");
});
app.get("/test", (req, res) => {
  res.send("Backend Updated Successfully");
});