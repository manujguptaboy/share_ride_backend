const express = require("express");

const { generateOtp, verifyOtp } = require("../controllers/aadhaarController");

const aadhaarRouter = express.Router();

aadhaarRouter.post("/otp/generate", generateOtp);
aadhaarRouter.post("/otp/verify", verifyOtp);

module.exports = aadhaarRouter;
