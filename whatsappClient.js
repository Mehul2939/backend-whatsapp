const { Server } = require("socket.io");
const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");
const pool = require("./db");

let io, client, lastQR = null, isConnected = false;

function initSocket(server){
  io = new Server(server, { cors: { origin: "*" } });

  client = new Client({
    authStrategy: new LocalAuth({ clientId: "device_1" }),
    puppeteer: { headless: true }
  });

  /* ===== SOCKET ===== */
  io.on("connection", socket => {
    console.log("🟢 PHP connected:", socket.id);

    socket.emit("status", isConnected ? "connected" : "disconnected");
    if(lastQR && !isConnected) socket.emit("qr", lastQR);

    let t = 120;
    const timer = setInterval(()=>{
      socket.emit("countdown", t--);
      if(t < 0) clearInterval(timer);
    },1000);
  });

  /* ===== QR ===== */
  client.on("qr", async qr => {
    lastQR = await QRCode.toDataURL(qr);
    isConnected = false;
    io.emit("qr", lastQR);
    io.emit("status", "disconnected");
  });

  /* ===== READY ===== */
  client.on("ready", async () => {
    isConnected = true;
    await pool.query("UPDATE devices SET status='connected'");
    io.emit("status", "connected");
  });

  /* ===== DISCONNECT ===== */
  client.on("disconnected", async () => {
    isConnected = false;
    await pool.query("UPDATE devices SET status='disconnected'");
    io.emit("status", "disconnected");
  });

  /* ===== INCOMING MESSAGE ===== */
  client.on("message", async msg => {
    io.emit("incoming_message", {
      from: msg.from.replace("@c.us",""),
      body: msg.body,
      timestamp: msg.timestamp
    });

    await pool.query(
      `INSERT INTO messages
       (user_id, sender_number, receiver_number, message, type, direction, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [null, msg.from.replace("@c.us",""), client.info.wid.user, msg.body, "text", "incoming"]
    );
  });

  client.initialize();
}

const getClient = () => client;
const getIO = () => io;

module.exports = { initSocket, getClient, getIO };
