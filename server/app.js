import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config({ path: "./config.env" });

const PORT = process.env.PORT || 4000;

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const onlineUsers = [];

io.on("connection", (socket) => {
  console.log(socket.id);
  let currentUser = {};
  socket.on("setUp", (userID, username) => {
    if (userID != null || username != null) {
      console.log(userID + " : " + username);
      const existingUserIndex = onlineUsers.findIndex((x) => x.uid === userID);
      if (existingUserIndex !== -1) {
        onlineUsers[existingUserIndex] = { userID, username };
      } else {
        currentUser = {
          socketID: socket.id,
          username: username,
          uid: userID,
        };
        onlineUsers.push(currentUser);
        console.log("User added:", onlineUsers[onlineUsers.length - 1]);
      }
      console.log("Online Users:", onlineUsers);
      io.emit("onlineUsers", onlineUsers);
    }
  });

  // socket.on("sendMessage", ({ receiverUserID, senderID }) => {
  //   console.log("hi");
  //   io.emit("messageNoti");
  // });

  socket.on("disconnect", (reason) => {
    console.log(reason);

    const disconnectedUser = onlineUsers.find((x) => x.uid == currentUser.uid);
    if (disconnectedUser !== -1) {
      onlineUsers.splice(onlineUsers.indexOf(disconnectedUser), 1);
      console.log("Online Users:", onlineUsers);
      io.emit("onlineUsers", onlineUsers);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`LLLLListening on http://localhost:${PORT}`);
});
