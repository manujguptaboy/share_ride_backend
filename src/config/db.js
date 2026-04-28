const { Pool } = require("pg");

const env = require("./env");

const connectionConfig = {
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  port: env.dbPort,
  host: env.dbHost,
};

if (env.cloudSqlConnectionName) {
  connectionConfig.host = `/cloudsql/${env.cloudSqlConnectionName}`;
}

if (env.dbSsl) {
  connectionConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(connectionConfig);

module.exports = pool;
