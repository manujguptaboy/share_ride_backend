const pool = require("../config/db");

const createUsersTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_terms_accepted BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  const alterTableQuery = `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE,
    ADD COLUMN IF NOT EXISTS is_terms_accepted BOOLEAN NOT NULL DEFAULT true;
  `;

  const fixNullPhoneQuery = `
    UPDATE users
    SET phone = CONCAT('TEMP-', id)
    WHERE phone IS NULL;
  `;

  const enforcePhoneNotNullQuery = `
    ALTER TABLE users
    ALTER COLUMN phone SET NOT NULL;
  `;

  try {
    await pool.query(createTableQuery);
    await pool.query(alterTableQuery);
    await pool.query(fixNullPhoneQuery);
    await pool.query(enforcePhoneNotNullQuery);
    console.log("[DB] users table is ready for signup UI.");
  } catch (error) {
    console.error("[DB] failed to create/update users table:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

createUsersTable();
