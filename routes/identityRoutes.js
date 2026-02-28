const express = require("express");
const router = express.Router();
const controller = require("../controllers/identityController");

router.post("/identify", controller.resolveCustomerIdentity);

module.exports = router;
