exports.active=(req, res )=>{
    console.log("request received for active ready ")
       return res.status(200).json({ message: 'backend ready' });
}