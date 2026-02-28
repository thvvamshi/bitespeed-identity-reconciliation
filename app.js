const express = require("express");
const identityRoutes = require("./routes/identityRoutes");

const app = express();

app.use(express.json());
app.use("/", identityRoutes);

module.exports = app;
