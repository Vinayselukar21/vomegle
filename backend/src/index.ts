import express from "express";
import http from "http";
import { Server, Socket } from "socket.io"; // Import Socket type for type safety
import { UserManager } from "./managers/UserManager";

const app = express();
const port = 3000; // default port to listen

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const userManager = new UserManager();

io.on("connection", (socket: Socket) => { // Specify the type of socket
  // console.log("a user connected"+ socket);
  userManager.addUser("someUserName", socket);
  socket.on("disconnect", () => {
    console.log("user disconnected");
    userManager.removeUser(socket.id);
  });
});

// start the Express server
server.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
