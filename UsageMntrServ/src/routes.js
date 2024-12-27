const { Router } = require('express');
const router = Router();
const mysqlConnection = require('./database');



router.get('/', (req, res) => {
    res.status(200).json('Server running and Database is connected.');
});

router.post('/logit',(req,res)=>{
    const {user_id, video , info} = req.body;
    const q = "INSERT INTO logs (user_id,info,video,dtime) VALUES (?,?,?,CURRENT_TIMESTAMP);";
    mysqlConnection.query(q,[user_id,info,video],(error)=>{
        if (error){
            console.log(error);
            res.status(500).json({status:"Failed", error:error.message});
        }else{
            res.status(200).json({status:"OK"});
        }

    });
});

module.exports = router;