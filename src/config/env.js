const dotenv = require("dotenv");

dotenv.config();

const env = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || "change-this-in-production",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  dbUser: process.env.DB_USER || "postgres",
  dbPassword: process.env.DB_PASSWORD || "",
  dbName: process.env.DB_NAME || "share_ride",
  dbHost: process.env.DB_HOST || "127.0.0.1",
  dbPort: Number(process.env.DB_PORT || 5432),
  dbSsl: process.env.DB_SSL === "true",
  cloudSqlConnectionName: process.env.CLOUD_SQL_CONNECTION_NAME || "",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || "",
  sandboxApiKey: process.env.SANDBOX_API_KEY || "",
  sandboxApiSecret: process.env.SANDBOX_API_SECRET || "",
  sandboxApiBaseUrl: process.env.SANDBOX_API_BASE_URL || "",
};

module.exports = env;
