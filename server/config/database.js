//Loading the package mysql2 and dotenv to manage environment variables
const mysql = require('mysql2');
require('dotenv').config();

//Creating a connection pool to the MySQL database using environment variables for configuration
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//Promisifying the connection pool to use async/await syntax for database operations
const promisePool = pool.promise();

//Function to test the database connection by acquiring a connection from the pool and releasing it immediately
const testConnection = async () => {
    try{
        const connection = await promisePool.getConnection();
        console.log('Database connection successful!');
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};

//Exporting the connection pool, promisified pool, and the test connection function for use in other parts of the application
module.exports = {pool, promisePool, testConnection};