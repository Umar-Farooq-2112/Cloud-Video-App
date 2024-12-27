const { Router, query } = require('express');
const router = Router();
const mysqlConnection = require('./database');



router.get('/', (req, res) => {
    res.status(200).json('Server running and Database is connected.');
});

router.post('/signup', (req, res) => {
    const { username, name, email, password, contact } = req.body;
    const q = "INSERT INTO users (username,name,email,password,contact) VALUES (?,?,?,?,?);";
    const q2 = "SELECT id,username,name,email,contact FROM users WHERE username = ?";

    mysqlConnection.query(q, [username, name, email, password, contact], (error, rows, field) => {
        if (error) {
            console.log(error);
            res.status(500).json({ status: 'Failed', error: error.message });
        } else {
            mysqlConnection.query(q2, [username], (error, rows, field) => {
                if (error) {
                    console.log(error);
                    res.status(500).json({ status: 'Failed', error: error.message });
                } else {
                    if (rows.length > 0) {
                        const user_data = rows[0];
                        res.status(200).json({ status: "OK", info: user_data });
                    }
                }
            });
        }
    });
});

router.get('/fetch-user/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    const q = "SELECT id,username,name,email,contact FROM users WHERE id = ?;";

    mysqlConnection.query(q, [user_id], (error, rows, field) => {
        if (error) {
            console.error(error);
            res.status(500).json({ status: 'Failed', error: error.message });
        } else {
            if (rows.length > 0) {
                const user_data = rows[0];
                res.status(200).json({ status: "OK", info: user_data });
            } else {
                res.status(401).json({ status: "Invalid" });
            }
        }
    });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const q = "SELECT id,username,name,email,contact FROM users WHERE username = ? AND password = ?;";


    mysqlConnection.query(q, [username, password], (error, rows, field) => {
        if (error) {
            console.error(error);
            res.status(500).json({ status: 'Failed', error: error.message });
        } else {
            if (rows.length > 0) {
                const user_data = rows[0];
                res.status(200).json({ status: "OK", info: user_data });
            } else {
                res.status(401).json({ status: "Invalid" });
            }
        }
    });
});

router.get("/id/:username", (req, res) => {
    const q = "SELECT id FROM users where username = ?;";
    mysqlConnection.query(q, [req.params.username], (error, rows, field) => {
        if (error) {
            console.log(error);
            res.status(500).json({ status: "Failed", error: error.message });
        }
        else {
            if (rows.length > 0) {
                const r = rows[0].id;
                res.status(200).json({ status: "OK", id: r });
            }
            else {
                res.status(401).json({ status: "Invalid" });
            }
        }
    });
});
module.exports = router;