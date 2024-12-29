require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const mysqlConnection = require("./database");
const { error } = require('console');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(cors());

const USAGE_MNTR_SERV_URL = process.env.USAGE_MNTR_URL;


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
    const user_id = req.body.user_id;
    const vname = req.body.vname;
    const bdwdt = parseFloat(req.body.bandwidth).toFixed(1);
    const q = "Select storage_used,bandwidth from user_info where id = ?";
    mysqlConnection.query(q, [user_id], async (error, rows, fields) => {
        if (error) {
            console.log(error);
            res.json({ status: 'Failed1', error: error.message });
        } else {
            if (rows.length > 0) {

                availBandwidth = parseFloat(rows[0].bandwidth).toFixed(1);
                strg = parseFloat(rows[0].storage_used).toFixed(1);

                const condition1 = (bdwdt <= 50 - strg)
                const condition2 = parseFloat(availBandwidth) >= parseFloat(bdwdt);
                const condition = condition1 && condition2;
                // console.log(typeof(availBandwidth));
                // console.log(typeof(bdwdt));

                // console.log(condition1);
                // console.log(condition2);
                // console.log(condition);

                if (condition) {
                    leftBandwidth = parseFloat(availBandwidth - bdwdt).toFixed(1);

                    const resultantStorage = (parseFloat(strg) + parseFloat(bdwdt)).toFixed(1);

                    const q1 = "INSERT INTO videos (user_id, vname) VALUES (?,?);";
                    const q3 = "UPDATE user_info SET storage_used = ? , bandwidth = ? where id = ?;";

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

                        try {
                            const videoUrl = await uploadToCloud(req.file, video_name_in_bucket);

                            await new Promise((resolve, reject) => {
                                mysqlConnection.query(q3, [resultantStorage, leftBandwidth, user_id], (error) => {
                                    if (error) {
                                        // reject(error);
                                        res.json({ status: "Failed", error: error.message })
                                    } else {
                                        resolve();
                                    }
                                });
                            });

                            const logData = { user_id: user_id, video: vname ,info: `Uploaded` };
                            axios.post(`${USAGE_MNTR_SERV_URL}/logit`, logData)
                                .then(response => {
                                    console.log("Log entry added:", response.data);
                                })
                                .catch(error => {
                                    console.error("Error while logging:", error.message);
                                    res.status(500).json({ status: "Failed", error: error.message });
                                });

                            res.status(200).json({
                                message: 'File uploaded successfully',
                                videoUrl: `https://storage.googleapis.com/${process.env.BUCKET_NAME}/${video_name_in_bucket}`,
                                status: "OK"
                            });
                        } catch (error) {
                            res.status(500).json({ status: "Failed2", error: error.message });
                        }
                    } catch (error) {
                        res.status(500).json({ status: "Failed3", error: error.message });
                    }
                } else {
                    res.status(400).json({ status: "Failed4", error: "Storage or Daily Bandwidth limit exceeded " });
                }

            }
            else {
                res.json({ status: "Failed", error: "Response have no bandwidth" });
            }
        }
    });

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


async function getVideoSizeMB(videoUrl) {
    try {
        // Make a HEAD request to get metadata
        const response = await fetch(videoUrl, { method: 'HEAD' });

        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
        }

        // Get the Content-Length header (size in bytes)
        const contentLength = response.headers.get('Content-Length');
        if (!contentLength) {
            throw new Error("Content-Length header is missing");
        }

        // Convert size to MB and round to 1 decimal point
        const sizeInMB = (parseInt(contentLength, 10) / (1024 * 1024)).toFixed(1);
        return parseFloat(sizeInMB);
    } catch (error) {
        console.error("Error getting video size:", error.message);
        return 0; // Return null if there's an error
    }
}



app.delete('/video', (req, res) => {
    const user_id = req.body.user_id;
    const vname = req.body.vname;
    const storage = req.body.storage;

    const name = user_id + "/" + vname;

    const q = "SELECT storage_used FROM user_info WHERE id = ?";
    const q1 = "DELETE FROM videos WHERE user_id = ? AND vname = ?";
    const q2 = "UPDATE user_info SET storage_used = ? WHERE id = ?";

    mysqlConnection.query(q1, [user_id, vname], (error) => {
        if (error) {
            console.log(error);
            res.status(500).json({ status: "Failed", error: error.message });
        } else {
            mysqlConnection.query(q, [user_id], (error, rows, fields) => {
                if (error) {
                    console.log(error);
                    res.status(500).json({ status: "Failed", error: error.message });
                } else {
                    if (rows.length > 0) {
                        const mystorage = rows[0].storage_used;
                        const left = parseFloat(mystorage - storage).toFixed(1);

                        mysqlConnection.query(q2, [left, user_id], (error) => {
                            if (error) {
                                console.log(error);
                                res.status(500).json({ status: "Failed", error: error.message });
                            } else {
                                deleteFile(name);

                                // Call the /logit API
                                const logData = { user_id: user_id, video: vname ,info: `Deleted` };
                                
                                axios.post(`${USAGE_MNTR_SERV_URL}/logit`, logData)
                                    .then(response => {
                                        console.log("Log entry added:", response.data);
                                        res.status(200).json({ status: "OK" });
                                    })
                                    .catch(error => {
                                        console.error("Error while logging:", error.message);
                                        res.status(500).json({ status: "Failed", error: error.message });
                                    });
                            }
                        });
                    }
                }
            });
        }
    });
});



app.get('/userinfo/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    const q = "SELECT * from user_info WHERE id = ?;";

    mysqlConnection.query(q, [user_id], (error, rows, field) => {
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.json({ status: "Failed", error: "Data Not Found" })
        }


    });
});

app.post('/userinfo/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    const q = "INSERT INTO user_info (id,storage_used,bandwidth) VALUES (?,0,100)";

    mysqlConnection.query(q, [user_id], (error) => {
        if (error) {
            console.log(error.message);
            res.json({ status: "Failed", error: error.message });
        } else {
            res.json({ status: "OK" });
        }


    });
});



app.get('/fetch-videos/:user_id', async (req, res) => {
    const user_id = req.params.user_id;

    // Validate user_id
    if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
    }

    // Query the database for video names
    const query = "SELECT vname FROM videos WHERE user_id = ?;";

    mysqlConnection.query(query, [user_id], async (error, rows) => {
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ error: 'Database query failed' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No videos found for the given user_id' });
        }

        const videos = rows.map(row => row.vname);

        try {
            const videoStreams = await Promise.all(videos.map(async (video_name) => {
                const videoPath = `${user_id}/${video_name}`;
                const file = bucket.file(videoPath);

                // Check if the file exists
                const [exists] = await file.exists();
                if (!exists) {
                    return { name: video_name, error: 'Video not found' };
                }

                // Generate a signed URL for each video
                const [url] = await file.getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 1000 * 60 * 60, // 1 hour
                });

                return { name: video_name, url };
            }));

            res.json({ videos: videoStreams });
        } catch (err) {
            console.error('Error fetching videos:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});

app.post('/videosize', async (req, res) => {
    const vname = req.body.vname;

    // Validate request
    if (!vname) {
        return res.status(400).json({ status: "Failed", error: "vname is required in the request body" });
    }

    try {
        // Get the file from the bucket
        const file = bucket.file(vname);

        // Check if the file exists
        const [exists] = await file.exists();
        if (!exists) {
            return res.status(404).json({ status: "Failed", error: "Video not found" });
        }

        // Get the metadata of the file
        const [metadata] = await file.getMetadata();

        // Extract the size in bytes and convert it to MB
        const sizeInBytes = metadata.size;
        const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(1); // Convert to MB and round to 1 decimal place
        console.log("Size in MBS: " + sizeInMB);
        // Return the size in the response
        res.status(200).json({ status: "OK", vsize: `${sizeInMB} MB` });
    } catch (error) {
        console.error('Error fetching video size:', error);
        res.status(500).json({ status: "Failed", error: "Internal server error" });
    }
});


app.post('/fetch-video', async (req, res) => {
    const { user_id, video_name } = req.body;

    // Validate request body
    if (!user_id || !video_name) {
        return res.status(400).json({ error: 'user_id and video_name are required' });
    }

    const videoPath = `${user_id}/${video_name}`;

    try {
        // Get the file from the bucket
        const file = bucket.file(videoPath);

        // Check if the file exists
        const [exists] = await file.exists();
        if (!exists) {
            return res.status(404).json({ error: 'Video not found' });
        }

        // Stream the video to the client
        res.setHeader('Content-Type', 'video/mp4'); // Adjust MIME type as necessary
        file.createReadStream()
            .on('error', (err) => {
                console.error('Error streaming file:', err);
                res.status(500).json({ error: 'Error streaming video' });
            })
            .pipe(res);
    } catch (err) {
        console.error('Error fetching video:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/video', upload, handleFileUpload);


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
