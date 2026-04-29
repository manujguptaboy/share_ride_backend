const pool = require("../config/db");

const findUserByEmail = async (email) => {
  const query = `
    SELECT id, name, email, phone, password_hash, is_terms_accepted
    FROM users
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
};

const findUserByPhone = async (phone) => {
  const query = `
    SELECT id, name, email, phone, password_hash, is_terms_accepted
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
    RETURNING id, name, email, phone, is_terms_accepted
  `;

  const values = [name, email, phone, passwordHash, isTermsAccepted];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserByPhone,
};
