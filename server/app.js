import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const PORT = process.env.PORT || 4000;

const app = express();

const httpServer = createServer(app);

const onlineUsers = [];

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log(socket.id);
});


httpServer.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
