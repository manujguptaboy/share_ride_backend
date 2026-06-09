const pool = require("../config/db");

const createUserOtpTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS user_otp (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      phone_otp_verified BOOLEAN NOT NULL DEFAULT false,
      aadhaar_verified BOOLEAN NOT NULL DEFAULT false,
      phone_otp_verified_at TIMESTAMPTZ,
      aadhaar_verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  const migrateFromUsersQuery = `
    INSERT INTO user_otp (user_id, phone_otp_verified, phone_otp_verified_at)
    SELECT id, otp_verified, CASE WHEN otp_verified THEN updated_at ELSE NULL END
    FROM users
    ON CONFLICT (user_id) DO UPDATE
    SET phone_otp_verified = EXCLUDED.phone_otp_verified,
        phone_otp_verified_at = COALESCE(user_otp.phone_otp_verified_at, EXCLUDED.phone_otp_verified_at),
        updated_at = NOW();
  `;

  const backfillMissingQuery = `
    INSERT INTO user_otp (user_id)
    SELECT u.id
    FROM users u
    LEFT JOIN user_otp o ON o.user_id = u.id
    WHERE o.user_id IS NULL;
  `;

  const dropLegacyColumnQuery = `
    ALTER TABLE users
    DROP COLUMN IF EXISTS otp_verified;
  `;

  try {
    await pool.query(createTableQuery);

    const usersHasOtpColumn = await pool.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name = 'otp_verified'
      LIMIT 1;
    `);

    if (usersHasOtpColumn.rowCount > 0) {
      await pool.query(migrateFromUsersQuery);
      await pool.query(dropLegacyColumnQuery);
    }

    await pool.query(backfillMissingQuery);
    console.log("[DB] user_otp table is ready.");
  } catch (error) {
    console.error("[DB] failed to create/update user_otp table:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

createUserOtpTable();
