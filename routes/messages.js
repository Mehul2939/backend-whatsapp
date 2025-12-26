const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getClient, getIO } = require("../whatsappClient");
const pool = require("../db");

const uploadBase = path.join(__dirname, "..", "uploads");

["images","pdfs","videos"].forEach(d=>{
  const p = path.join(uploadBase,d);
  if(!fs.existsSync(p)) fs.mkdirSync(p, {recursive:true});
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if(file.mimetype.startsWith("image/")) cb(null, path.join(uploadBase,"images"));
    else if(file.mimetype==="application/pdf") cb(null, path.join(uploadBase,"pdfs"));
    else cb(null, path.join(uploadBase,"videos"));
  },
  filename: (req, file, cb) => cb(null, Date.now()+"_"+file.originalname)
});
const upload = multer({ storage });

router.post("/send", upload.any(), async (req,res)=>{
  const client = getClient();
  const io = getIO();
  if(!client?.info) return res.json({error:"WhatsApp not ready"});

  let { contacts, message } = req.body;
  if(typeof contacts==="string") contacts = JSON.parse(contacts);

  for(const number of contacts){
    if(message){
      await client.sendMessage(number+"@c.us", message);
      await pool.query(
        `INSERT INTO messages
         (user_id, sender_number, receiver_number, message, type, direction, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [null, client.info.wid.user, number, message, "text", "outgoing"]
      );
    }
    io.emit("sent", {number, status:"success"});
  }

  res.json({success:true});
});

module.exports = router;
