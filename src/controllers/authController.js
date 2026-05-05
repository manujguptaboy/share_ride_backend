const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const env = require("../config/env");
const {
  createUser,
  findUserByEmail,
  findUserByPhone,
} = require("../repositories/userRepository");

const createAuthToken = (user) =>
  jwt.sign({ userId: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: "1d",
  });

const signup = async (req, res) => {
  const { name, email, phone, password, confirmPassword, agreeToTerms } =
    req.body;
  const safeEmail = email ? email.toLowerCase() : "unknown";

  if (!name || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Name, email, phone, password and confirmPassword are required.",
    });
  }

  if (!agreeToTerms) {
    return res.status(400).json({
      success: false,
      message: "Please accept terms and conditions.",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters.",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match.",
    });
  }

  try {
    const existingEmailUser = await findUserByEmail(email);
    if (existingEmailUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const normalizedPhone = phone.trim();
    const existingPhoneUser = await findUserByPhone(normalizedPhone);
    if (existingPhoneUser) {
      return res.status(409).json({
        success: false,
        message: "Phone number is already registered.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = await createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: normalizedPhone,
      passwordHash,
      isTermsAccepted: true,
    });

    const token = createAuthToken(createdUser);
    console.log(`[AUTH] Signup successful: ${safeEmail}`);

    return res.status(201).json({
      success: true,
      message: "Signup successful.",
      token,
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        phone: createdUser.phone,
        otpVerified: createdUser.otp_verified,
      },
    });
  } catch (error) {
    console.error(`[AUTH] Signup failed for ${safeEmail}:`, error.message);
    return res.status(500).json({
      success: false,
      message: "Database error while signing up.",
    });
  }
};

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

  if (!user.otp_verified) {
    console.log(`[AUTH] Credentials ok, OTP not verified: ${safeEmail}`);
    return res.status(200).json({
      success: true,
      requireOtpVerification: true,
      message: "Please verify your phone number to continue.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        otpVerified: false,
      },
    });
  }

  const token = createAuthToken(user);

  console.log(`[AUTH] Login successful: ${safeEmail}`);

  return res.status(200).json({
    success: true,
    requireOtpVerification: false,
    message: "Login successful.",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      otpVerified: true,
    },
  });
};

module.exports = {
  signup,
  login,
};
