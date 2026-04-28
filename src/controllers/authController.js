const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const env = require("../config/env");
const { findUserByEmail } = require("../repositories/userRepository");

const login = async (req, res) => {
  const { email, password } = req.body;
  const safeEmail = email ? email.toLowerCase() : "unknown";

  if (!email || !password) {
    console.warn("[AUTH] Login attempt with missing email/password");
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  let user;

  try {
    console.log(`[AUTH] Login lookup for ${safeEmail}`);
    user = await findUserByEmail(email);
  } catch (error) {
    console.error(`[AUTH] Database error for ${safeEmail}:`, error.message);
    return res.status(500).json({
      success: false,
      message: "Database error while logging in.",
    });
  }

  if (!user) {
    console.warn(`[AUTH] Login failed, user not found: ${safeEmail}`);
    return res.status(401).json({
      success: false,
      message: "Invalid credentials.",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    console.warn(`[AUTH] Login failed, invalid password: ${safeEmail}`);
    return res.status(401).json({
      success: false,
      message: "Invalid credentials.",
    });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    env.jwtSecret,
    { expiresIn: "1d" }
  );

  console.log(`[AUTH] Login successful: ${safeEmail}`);

  return res.status(200).json({
    success: true,
    message: "Login successful.",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
};

module.exports = {
  login,
};
