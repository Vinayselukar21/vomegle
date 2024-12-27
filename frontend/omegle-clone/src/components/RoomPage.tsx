import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { Card, CardContent } from "./ui/card";

const RoomPage = ({
  userName,
  localVideoTrack,
  localAudioTrack,
}: {
  userName: string;
  localVideoTrack: MediaStreamTrack | null;
  localAudioTrack: MediaStreamTrack | null;
}) => {
  const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL
  //@ts-ignore
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lobby, setLobby] = useState<boolean>(true);
  //@ts-ignore
  const [sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);
  //@ts-ignore
  const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(
    null
  );
  console.log(SOCKET_SERVER_URL);
  //@ts-ignore
  const [remoteMediaStream, setRemoteMediaStream] =
    useState<MediaStream | null>(null);
  //@ts-ignore
  const [remoteVideoTrack, setRemoteVideoTrack] =
    useState<MediaStreamTrack | null>(null);
  //@ts-ignore
  const [remoteAudioTrack, setRemoteAudioTrack] =
    useState<MediaStreamTrack | null>(null);

  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const config = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: "turn:your-turn-server",
        username: "your-username",
        credential: "your-credential",
      },
    ],
  };
  
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);
  
    socket.on("send-offer", async ({ roomId }: { roomId: string }) => {
      console.log("Send offer to remote", roomId);
      setLobby(false);
  
      const pc = new RTCPeerConnection(config);
      setSendingPc(pc);
      console.log("New peer connection", pc);
  
      // Add local tracks to the connection
      if (localVideoTrack) {
        pc.addTrack(localVideoTrack);
      }
      if (localAudioTrack) {
        pc.addTrack(localAudioTrack);
      }
  
      // Handle ICE candidates
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            roomId,
            type: "sender",
          });
        }
      };
  
      // Negotiation needed event
      pc.onnegotiationneeded = async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", {
          roomId,
          sdp: offer,
        });
      };
    });
  
    socket.on(
      "offer",
      async ({
        roomId,
        sdp: remoteSdp,
      }: {
        roomId: string;
        sdp: RTCSessionDescriptionInit;
      }) => {
        console.log("Received offer from remote", roomId);
        setLobby(false);
  
        const pc = new RTCPeerConnection(config);
        setReceivingPc(pc);
  
        const remoteStream = new MediaStream();
        setRemoteMediaStream(remoteStream);
  
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
  
        // Handle incoming tracks
        pc.ontrack = ({ track }) => {
          console.log("Track received:", track.kind);
          remoteStream.addTrack(track); // Add track to remote stream
        };
  
        // Handle ICE candidates
        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("add-ice-candidate", {
              candidate: e.candidate,
              type: "receiver",
              roomId,
            });
          }
        };
  
        await pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));
  
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
  
        socket.emit("answer", {
          roomId,
          sdp: answer,
        });
      }
    );
  
    socket.on(
      "answer",
      ({
        roomId,
        sdp: remoteSdp,
      }: {
        roomId: string;
        sdp: RTCSessionDescriptionInit;
      }) => {
        console.log("Received answer from remote", roomId);
        setSendingPc((pc) => {
          pc?.setRemoteDescription(new RTCSessionDescription(remoteSdp));
          return pc;
        });
      }
    );
  
    socket.on(
      "add-ice-candidate",
      ({
        candidate,
        type,
      }: {
        candidate: RTCIceCandidateInit;
        type: "sender" | "receiver";
      }) => {
        if (type === "sender") {
          setReceivingPc((pc) => {
            pc?.addIceCandidate(new RTCIceCandidate(candidate));
            return pc;
          });
        } else {
          setSendingPc((pc) => {
            pc?.addIceCandidate(new RTCIceCandidate(candidate));
            return pc;
          });
        }
      }
    );

    setSocket(socket);
  }, [userName, localVideoTrack, localAudioTrack]);
  
  useEffect(() => {
    if (localVideoRef.current && localVideoTrack) {
      localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
      localVideoRef.current.play();
    }
  }, [localVideoRef, localVideoTrack]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">
          Welcome to the Room {userName}
        </h1>
        <Link to="/" className="text-blue-500 hover:text-blue-700">
          Back to Landing Page
        </Link>
        {lobby && (
          <div className="flex justify-center items-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Waiting in the lobby</h1>
            </div>
          </div>
        )}
        <Card>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 ">
            <video autoPlay width={400} height={300} ref={localVideoRef} />
            <video autoPlay width={400} height={300} ref={remoteVideoRef} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoomPage;
