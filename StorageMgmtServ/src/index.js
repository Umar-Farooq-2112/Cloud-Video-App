require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const mysqlConnection = require("./database");
const { error } = require('console');

const app = express();
const port = 3000;

const storage = new Storage({
    keyFilename: process.env.KEYFILENAME,
    projectId: process.env.PROJECT_ID,
});
const bucket = storage.bucket(process.env.BUCKET_NAME);

async function uploadToCloud(file, fileName) {
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
    });

    return new Promise((resolve, reject) => {
        blobStream.on('finish', () => {
            resolve(`https://storage.googleapis.com/${process.env.BUCKET_NAME}/${fileName}`);
        });

        blobStream.on('error', (err) => {
            reject(err);
        });

        blobStream.end(file.buffer);
    });
} const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
}).single('video');

// Handle the file upload directly
async function handleFileUpload(req, res) {
    const strg = req.body.storage;
    const user_id = req.body.user_id;
    const vname = req.body.vname;

    console.log(strg);
    console.log(user_id);
    console.log(vname);

    if (strg <= 50) {
        const q1 = "INSERT INTO videos (user_id, vname) VALUES (?,?);";
        const q3 = "UPDATE user_info SET storage_used = ?;";

        try {
            // Insert video record
            await new Promise((resolve, reject) => {
                mysqlConnection.query(q1, [user_id, vname], (error, rows) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(rows);
                    }
                });
            });


            const video_name_in_bucket = `${user_id}/${vname}`;

            // Process the file upload after the database is updated
            try {
                const videoUrl = await uploadToCloud(req.file, video_name_in_bucket);
                await new Promise((resolve, reject) => {
                    mysqlConnection.query(q3, [strg], (error) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                });

                res.status(200).json({
                    message: 'File uploaded successfully',
                    videoUrl: `https://storage.googleapis.com/${process.env.BUCKET_NAME}/${video_name_in_bucket}`,
                    status: "OK"
                });
            } catch (error) {
                res.status(500).json({ status: "Failed", error: error.message });
            }
        } catch (error) {
            res.status(500).json({ status: "Failed", error: error.message });
        }
    } else {
        res.status(400).json({ status: "Failed", error: "Storage limit exceeded" });
    }
}

async function deleteFile(fileName) {
    try {
        const bucket = storage.bucket(process.env.BUCKET_NAME);
        const file = bucket.file(fileName);

        const [exists] = await file.exists();
        if (exists) {
            await file.delete();
            return 0;
        } else {
            console.log(`File ${fileName} does not exist.`);
            return 0;
        }
    } catch (error) {
        console.error('Error while deleting file:', error);
        return 1;
    }
}





app.use(express.urlencoded({ extended: true }));
app.use(express.json());



app.delete('/video', (req, res) => {
    const user_id = req.body.user_id;
    const vname = req.body.vname;
    const storage = req.body.storage;

    const name = user_id + "/" + vname;
    
    console.log(user_id);
    console.log(vname);
    console.log(storage);

    const q1 = "DELETE FROM videos WHERE user_id = ? AND vname = ?;";
    const q2 = "UPDATE user_info SET storage_used = ? WHERE id = ?;";

    mysqlConnection.query(q1, [user_id, vname], (error) => {
        if (error) {
            console.log(error);
            res.status(500).json({ status: "Failed", error: error.message });
        } else {
            mysqlConnection.query(q2, [storage, user_id], (error) => {
                if (error) {
                    console.log(error);
                    res.status(500).json({ status: "Failed", error: error.message });
                } else {
                    deleteFile(name);
                    res.status(200).json({status:"OK"})
                }
            });
        }
    });
});



app.post('/video', upload, handleFileUpload);


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
