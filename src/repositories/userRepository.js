const pool = require("../config/db");

const userSelectFields = `
  u.id,
  u.name,
  u.email,
  u.phone,
  u.password_hash,
  u.is_terms_accepted,
  COALESCE(o.phone_otp_verified, false) AS phone_otp_verified,
  COALESCE(o.aadhaar_verified, false) AS aadhaar_verified
`;

const userFromClause = `
  FROM users u
  LEFT JOIN user_otp o ON o.user_id = u.id
`;

const findUserByEmail = async (email) => {
  const query = `
    SELECT ${userSelectFields}
    ${userFromClause}
    WHERE LOWER(u.email) = LOWER($1)
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
};

const findUserByPhone = async (phone) => {
  const query = `
    SELECT ${userSelectFields}
    ${userFromClause}
    WHERE u.phone = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [phone]);
  return rows[0] || null;
};

const findUserById = async (userId) => {
  const query = `
    SELECT ${userSelectFields}
    ${userFromClause}
    WHERE u.id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0] || null;
};

const createUser = async ({ name, email, phone, passwordHash, isTermsAccepted }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userQuery = `
      INSERT INTO users (name, email, phone, password_hash, is_terms_accepted)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone, is_terms_accepted
    `;

    const values = [name, email, phone, passwordHash, isTermsAccepted];
    const { rows } = await client.query(userQuery, values);
    const user = rows[0];

    await client.query(
      `
        INSERT INTO user_otp (user_id)
        VALUES ($1)
      `,
      [user.id]
    );

    await client.query("COMMIT");

    return {
      ...user,
      phone_otp_verified: false,
      aadhaar_verified: false,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserByPhone,
  findUserById,
};
