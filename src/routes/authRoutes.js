const express = require("express");

const { signup, login, getVerificationStatus } = require("../controllers/authController");

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.get("/verification/:userId", getVerificationStatus);

module.exports = authRouter;
