const express = require("express");
const identityRoutes = require("./routes/identityRoutes");

const app = express();

app.use(express.json({ limit: "10kb" }));
app.use("/", identityRoutes);

module.exports = app;
