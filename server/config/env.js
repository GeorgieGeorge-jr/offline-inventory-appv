require("dotenv").config();

const requiredEnvs = [
  "DATABASE_URL",
  "JWT_SECRET",
];

for (const envName of requiredEnvs) {
  if (!process.env[envName]) {
    throw new Error(`${envName} is missing from environment variables`);
  }
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5001,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
};