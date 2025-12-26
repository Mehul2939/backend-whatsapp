const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const { initSocket } = require("./whatsappClient");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/messages", require("./routes/messages"));

// Initialize WhatsApp socket
initSocket(server);

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
