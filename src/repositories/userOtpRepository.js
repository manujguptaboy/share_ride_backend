const pool = require("../config/db");

const phoneLast10Expr = "RIGHT(REGEXP_REPLACE(u.phone, '\\\\D', '', 'g'), 10)";

const ensureUserOtp = async (userId) => {
  const query = `
    INSERT INTO user_otp (user_id)
    VALUES ($1)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING user_id, phone_otp_verified, aadhaar_verified
  `;

  const { rows } = await pool.query(query, [userId]);
  if (rows[0]) return rows[0];

  const { rows: existing } = await pool.query(
    `
      SELECT user_id, phone_otp_verified, aadhaar_verified
      FROM user_otp
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  return existing[0] || null;
};

const findByUserId = async (userId) => {
  const query = `
    SELECT user_id, phone_otp_verified, aadhaar_verified,
           phone_otp_verified_at, aadhaar_verified_at
    FROM user_otp
    WHERE user_id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0] || null;
};

const setPhoneOtpVerifiedByPhone = async (phone) => {
  const raw = String(phone ?? "").trim();
  if (!raw) return { rowCount: 0 };

  const digits = raw.replace(/\D/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : "";
  if (last10.length !== 10) return { rowCount: 0 };

  const query = `
    INSERT INTO user_otp (user_id, phone_otp_verified, phone_otp_verified_at)
    SELECT u.id, true, NOW()
    FROM users u
    WHERE ${phoneLast10Expr} = $1
    ON CONFLICT (user_id) DO UPDATE
    SET phone_otp_verified = true,
        phone_otp_verified_at = NOW(),
        updated_at = NOW()
  `;

  const { rowCount } = await pool.query(query, [last10]);
  return { rowCount };
};

const setAadhaarVerifiedByUserId = async (userId) => {
  const query = `
    INSERT INTO user_otp (user_id, aadhaar_verified, aadhaar_verified_at)
    VALUES ($1, true, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET aadhaar_verified = true,
        aadhaar_verified_at = NOW(),
        updated_at = NOW()
  `;

  const { rowCount } = await pool.query(query, [userId]);
  return { rowCount };
};

module.exports = {
  ensureUserOtp,
  findByUserId,
  setPhoneOtpVerifiedByPhone,
  setAadhaarVerifiedByUserId,
};
