DROP DATABASE IF EXISTS StorageMgmtServDB;
CREATE DATABASE StorageMgmtServDB;
USE StorageMgmtServDB;


CREATE TABLE user_info
(
id INT AUTO_INCREMENT PRIMARY KEY,
storage_used DOUBLE,
bandwidth DOUBLE DEFAULT(100)
);

CREATE TABLE videos
(
    user_id INT,
    vname VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES user_info(id),
    CONSTRAINT unique_user_video UNIQUE (user_id, vname)
);

CREATE EVENT reset_bandwidth
ON SCHEDULE EVERY 1 DAY
STARTS '2024-12-24 02:40:00'  -- Set the starting date and time
DO
UPDATE user_info
SET bandwidth = 100;
