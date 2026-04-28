const dotenv = require("dotenv");

dotenv.config();

const env = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || "change-this-in-production",
  dbUser: process.env.DB_USER || "postgres",
  dbPassword: process.env.DB_PASSWORD || "",
  dbName: process.env.DB_NAME || "share_ride",
  dbHost: process.env.DB_HOST || "127.0.0.1",
  dbPort: Number(process.env.DB_PORT || 5432),
  dbSsl: process.env.DB_SSL === "true",
  cloudSqlConnectionName: process.env.CLOUD_SQL_CONNECTION_NAME || "",
};

module.exports = env;
