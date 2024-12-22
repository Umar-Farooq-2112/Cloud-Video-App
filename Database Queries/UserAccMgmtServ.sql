DROP DATABASE IF EXISTS UserAccMgmtServDB;
CREATE DATABASE UserAccMgmtServDB;
use UserAccMgmtServDB;

CREATE TABLE Users(
    id INT AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE,
    name VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(255),
    contact VARCHAR(25) UNIQUE,
    CONSTRAINT users_primary_key PRIMARY KEY (id)
);
