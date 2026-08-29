const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const transactionRoutes = require("./routes/transactionRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const exportRoutes = require("./routes/exportRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();


/* SECURITY */
app.use(helmet());


/* CORS */
const corsOptions = {
  origin: "https://house-expense-1.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));


/* BODY PARSING */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


/* HEALTH CHECK */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "House Expense API is running"
  });
});


/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/export", exportRoutes);


/* 404 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  });
});


/* ERROR HANDLER */
app.use((error, req, res, next) => {

  console.error("API Error:", error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error"
  });

});


module.exports = app;