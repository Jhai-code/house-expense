const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.on("connect", () => {
  console.log("PostgreSQL connection established");
});

pool.on("error", error => {
  console.error(
    "Unexpected PostgreSQL error:",
    error
  );
});

async function query(text, params) {
  return pool.query(text, params);
}

async function testConnection() {
  const result = await pool.query(
    "SELECT NOW() AS current_time"
  );

  return result.rows[0];
}

module.exports = {
  pool,
  query,
  testConnection
};