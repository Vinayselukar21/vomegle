import express, { Request, Response } from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
const app = express();
const port = 3000; // default port to listen

const server = http.createServer(app);
const io = new Server(server);


app.use(cors());


app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

io.on('connection', (socket) => {
    console.log('a user connected');
  });

// start the Express server
server.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
