const express = require("express");

const { sendOtp, verifyOtp } = require("../controllers/otpController");

const otpRouter = express.Router();

otpRouter.post("/send", sendOtp);
otpRouter.post("/verify", verifyOtp);

module.exports = otpRouter;
