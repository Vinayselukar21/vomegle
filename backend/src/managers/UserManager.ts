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
  addUser(socket: Socket, userName: string) {
    //As people join they are pushed into a queue
    this.users.push({ socket, userName });
    this.queue.push(socket.id);

    // Random 2 people are picked from the queue and put into a room
    this.clearQueue();
    this.initHandlers(socket);
  }

  // for removing a user from a queue
  removeUser(socketId: string) {
    this.users = this.users.filter((user) => user.socket.id === socketId);
    this.queue = this.queue.filter((id) => id === socketId);
  }

  // for clearing the queue
  clearQueue() {
    if (this.queue.length < 2) {
      return;
    }

    const user1 = this.users.find(
      (user) => user.socket.id === this.queue.pop()
    );
    const user2 = this.users.find(
      (user) => user.socket.id === this.queue.pop()
    );

    if (!user1 || !user2) {
      return;
    }

    // A room is created with 2 users by this createRoom function
    const room = this.roomManager?.createRoom(user1, user2);
  }

  // when a new user is added
  initHandlers(socket: Socket) {
    //when server receives an offer from a user it calls onOffer function
    socket.on("offer", ({ sdp, roomId }: { sdp: string; roomId: string }) => {
      this.roomManager.onOffer(roomId, sdp);
    });

    //when the user2 responds to the offer with an answer it calls onAnswer function
    socket.on("answer", ({ sdp, roomId }: { sdp: string; roomId: string }) => {
      this.roomManager.onAnswer(roomId, sdp);
    });
  }
}
