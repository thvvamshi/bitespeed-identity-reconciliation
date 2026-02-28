const express = require("express");
const identityRoutes = require("./routes/identityRoutes");

const app = express();

app.use(express.json({ limit: "10kb" }));

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Bitespeed Identity Reconciliation Service is running.");
});

// Use identity routes
app.use("/", identityRoutes);

module.exports = app;
