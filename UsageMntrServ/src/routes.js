const { Router } = require('express');
const router = Router();
const mysqlConnection = require('./database');



router.get('/', (req, res) => {
    res.status(200).json('Server running and Database is connected.');
});

router.post('/logit',(req,res)=>{
    const {info} = req.body;
    const q = "INSERT INTO logs (info,dtime) VALUES (?,CURRENT_TIMESTAMP);";
    mysqlConnection.query(q,[info],(error)=>{
        if (error){
            console.log(error);
            res.status(500).json({status:"Failed", error:error.message});
        }else{
            res.status(200).json({status:"OK"});
        }

    });
});

module.exports = router;