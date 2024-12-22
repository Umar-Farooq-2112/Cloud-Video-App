DROP DATABASE IF EXISTS StorageMgmtServDB;
CREATE DATABASE StorageMgmtServDB;
USE StorageMgmtServDB;


CREATE TABLE user_info
(
id INT AUTO_INCREMENT PRIMARY KEY,
storage_used DOUBLE,
bandwidth_left DOUBLE
);

CREATE TABLE videos
(
    user_id INT,
    vname VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES user_info(id),
    CONSTRAINT unique_user_video UNIQUE (user_id, vname)
);