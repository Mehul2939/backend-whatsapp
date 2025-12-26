const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const { initSocket } = require("./whatsappClient");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());

app.use("/api/messages", require("./routes/messages"));

initSocket(server);

server.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
