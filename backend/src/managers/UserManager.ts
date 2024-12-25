import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";

export interface User {
  socket: Socket;
  userName: string;
}

// All users are stored in this userManager class
export class UserManager {
  private users: User[];
  private queue: string[];
  private roomManager: RoomManager;
  // initialize the users queue
  constructor() {
    this.users = [];
    this.queue = [];
    this.roomManager = new RoomManager();
  }

  // for adding a user into a queue
  addUser(userName: string, socket: Socket) {
    //As people join they are pushed into a queue
    console.log("User joined", userName, socket.id);
    this.users.push({ userName, socket });
    this.queue.push(socket.id);

    // Emitting 'lobby' event to the socket to notify the frontend
    socket.emit("lobby");
    // Random 2 people are picked from the queue and put into a room
    this.clearQueue();
    this.initHandlers(socket);
  }

  // for removing a user from a queue
  removeUser(socketId: string) {
    const user = this.users.find((user) => user.socket.id === socketId);
    this.users = this.users.filter((user) => user.socket.id !== socketId);
    this.queue = this.queue.filter((id) => id === socketId);
  }

  // for clearing the queue
  clearQueue() {
    console.log("inside clearQueue");
    console.log(this.queue.length);
    if (this.queue.length < 2) {
      return;
    }
    // console.log(this.queue);

    const id1 = this.queue.pop();
    const id2 = this.queue.pop();
    console.log("id is " + id1 + " " + id2);
    const user1 = this.users.find((user) => user.socket.id === id1);
    const user2 = this.users.find((user) => user.socket.id === id2);

    if (!user1 || !user2) {
      return;
    }
    console.log("Creating room");
    // A room is created with 2 users by this createRoom function
    const room = this.roomManager?.createRoom(user1, user2);

    this.clearQueue();
  }

  // when a new user is added
  initHandlers(socket: Socket) {
    //when server receives an offer from a user it calls onOffer function
    socket.on("offer", ({ roomId, sdp }: { sdp: string; roomId: string }) => {
      this.roomManager.onOffer(roomId, sdp, socket.id);
    });

    //when the user2 responds to the offer with an answer it calls onAnswer function
    socket.on("answer", ({ roomId, sdp }: { sdp: string; roomId: string }) => {
      this.roomManager.onAnswer(roomId, sdp, socket.id);
    });

    socket.on("add-ice-candidate", ({ candidate, roomId, type }) => {
      this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
    });
  }
}