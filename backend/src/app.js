const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const transactionRoutes = require("./routes/transactionRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const exportRoutes = require("./routes/exportRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();


/* =========================================
   SECURITY
========================================= */

app.use(helmet());


/* =========================================
   CORS
========================================= */

const allowedOrigins = [
  "https://house-expense-1.onrender.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

app.use(
  cors({
    origin: function (origin, callback) {

      // Allow requests without origin
      // such as Postman or direct server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ],

    credentials: true
  })
);


/* =========================================
   BODY PARSING
========================================= */

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb"
  })
);


/* =========================================
   HEALTH CHECK
========================================= */

app.get("/", (req, res) => {

  res.status(200).json({
    success: true,
    message: "House Expense API is running"
  });

});


app.get("/api/health", (req, res) => {

  res.status(200).json({
    success: true,
    message: "House Expense API is running",
    timestamp: new Date().toISOString()
  });

});


/* =========================================
   API ROUTES
========================================= */

app.use("/api/auth", authRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/transactions", transactionRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/export", exportRoutes);


/* =========================================
   404 HANDLER
========================================= */

app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: "API route not found"
  });

});


/* =========================================
   ERROR HANDLER
========================================= */

app.use((error, req, res, next) => {

  console.error("API Error:", error);

  res.status(
    error.status || 500
  ).json({

    success: false,

    message:
      error.message ||
      "Internal server error"

  });

});


module.exports = app;