const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");

const app = express();

/*
========================================
MIDDLEWARE
========================================
*/

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static("uploads"));   // agar pehle se hai to skip karein
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/tools", require("./routes/Toolroutes"));
/*
========================================
HEALTH CHECK
========================================
*/

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Portfolio Backend API is running",
  });
});

/*
========================================
ROUTES
========================================
*/

app.use("/api/projects", projectRoutes);

app.use("/api/auth", authRoutes);

/*
========================================
DATABASE
========================================
*/

if (mongoose.connection.readyState === 0) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error);
    });
}

/*
========================================
LOCAL SERVER
========================================
*/

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

/*
========================================
EXPORT APP
========================================
*/

module.exports = app;