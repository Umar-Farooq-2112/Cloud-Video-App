const { Router } = require('express');
const router = Router();
const mysqlConnection = require('./database');


router.get('/', (req, res) => {
    res.status(200).json('Server running and Database is connected.');
});

router.post('/upload-video',(req,res)=>{
    res.json({status:"OK"});


});

module.exports = router;