const { Sequelize } = require('sequelize'); // Correct import
require('dotenv').config();

// Initialize Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_DATABASE,  // Database name
  process.env.DB_USERNAME,  // Username
  process.env.DB_PASSWORD,  // Password
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,  // Optional: Disable SQL logging
  }
);

module.exports = sequelize;
