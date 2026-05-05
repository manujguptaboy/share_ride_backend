const pool = require("../config/db");

const findUserByEmail = async (email) => {
  const query = `
    SELECT id, name, email, phone, password_hash, is_terms_accepted, otp_verified
    FROM users
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
};

const findUserByPhone = async (phone) => {
  const query = `
    SELECT id, name, email, phone, password_hash, is_terms_accepted, otp_verified
    FROM users
    WHERE phone = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [phone]);
  return rows[0] || null;
};

const createUser = async ({ name, email, phone, passwordHash, isTermsAccepted }) => {
  const query = `
    INSERT INTO users (name, email, phone, password_hash, is_terms_accepted)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, phone, is_terms_accepted, otp_verified
  `;

  const values = [name, email, phone, passwordHash, isTermsAccepted];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const updateOtpVerifiedByPhone = async (phone) => {
  const raw = String(phone ?? "").trim();
  if (!raw) return { rowCount: 0 };

  const digits = raw.replace(/\D/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : "";
  if (last10.length !== 10) return { rowCount: 0 };

  const query = `
    UPDATE users
    SET otp_verified = true,
        updated_at = NOW()
    WHERE RIGHT(REGEXP_REPLACE(phone, '\\D', '', 'g'), 10) = $1
  `;

  const { rowCount } = await pool.query(query, [last10]);
  return { rowCount };
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserByPhone,
  updateOtpVerifiedByPhone,
};
