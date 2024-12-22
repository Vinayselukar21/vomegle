import { Socket } from "socket.io";
import { User } from "./UserManager";

let GLOBAL_ROOM_ID = 1;

interface Room {
  roomId: string;
  user1: User;
  user2: User;
}
export class RoomManager {
  private rooms: Map<string, Room>;

  constructor() {
    this.rooms = new Map();
  }

  // Here a room is created with 2 users
  createRoom(user1: User, user2: User) {
    const roomId = this.generate();
    this.rooms.set(roomId.toString(), {
      roomId: roomId.toString(),
      user1,
      user2,
    });

    // Here the user1 is asked to give his webRTC configuration whis is sdp (session description protocol)
    user1?.socket.emit("send-offer", {
      roomId,
    });
  }

  // this function sends the offer to the other user which is user2 in this case
  onOffer(roomId: string, sdp: string) {
    const user2 = this.rooms.get(roomId)?.user2;
    // emitting an offer to user2
    user2?.socket?.emit("offer", {
      sdp,
    });
  }

  // this function sends the answer to the other user which is user1 in this case
  onAnswer(roomId: string, sdp: string) {
    const user1 = this.rooms.get(roomId)?.user1;
    // returns the answer to user1 which is its webRTC configuration in sdp
    user1?.socket?.emit("offer", {
      sdp,
    });
  }

  // for generating a random room id
  generate() {
    return GLOBAL_ROOM_ID++;
  }
}
