require('dotenv').config();
const mysql = require('mysql2');

// process.env.DB_HOST
// process.env.DB_USER
// process.env.DB_PASSWORD
// process.env.DB_DATABASE

const mysqlConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

mysqlConnection.connect(function (error) {
    if(error){
        console.log(error);
        return;
    } else {
        console.log('Database is connected');
    }
});

module.exports = mysqlConnection;