DROP DATABASE IF EXISTS StorageMgmtServDB;
CREATE DATABASE StorageMgmtServDB;
USE StorageMgmtServDB;


CREATE TABLE user_info
(
id INT AUTO_INCREMENT PRIMARY KEY,
storage_used DOUBLE
);

CREATE TABLE videos
(
id INT REFERENCES user_info(id),
vname VARCHAR(100)
);