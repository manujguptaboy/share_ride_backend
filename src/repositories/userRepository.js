const pool = require("../config/db");

const findUserByEmail = async (email) => {
  const query = `
    SELECT id, name, email, password_hash
    FROM users
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
};

module.exports = {
  findUserByEmail,
};
