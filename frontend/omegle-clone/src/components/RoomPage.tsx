import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "./ui/button";
import { ChevronRight } from "lucide-react";

const RoomPage = ({
  userName,
  localVideoTrack,
  localAudioTrack,
}: {
  userName: string;
  localVideoTrack: MediaStreamTrack | null;
  localAudioTrack: MediaStreamTrack | null;
}) => {
  const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL;
  const TURN_SERVER_URL = import.meta.env.VITE_TURN_SERVER_URL;
  const TURN_SERVER_USERNAME = import.meta.env.VITE_TURN_SERVER_USERNAME;
  const TURN_SERVER_CREDENTIAL = import.meta.env.VITE_TURN_SERVER_CREDENTIAL;
  // @ts-ignore
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

  const configuration: RTCConfiguration = {
    iceServers: [
      {
        urls: TURN_SERVER_URL, // Ensure the URL starts with "turn:" for TURN servers
        username: TURN_SERVER_USERNAME,
        credential: TURN_SERVER_CREDENTIAL,
      },
    ],
  };

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);

    // Send offer event
    socket.on("send-offer", async ({ roomId }: { roomId: string }) => {
      console.log("Send offer to remote", roomId);
      setLobby(false);

      const pc = new RTCPeerConnection(configuration);
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

    // Receive offer event
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

        const pc = new RTCPeerConnection(configuration);
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

    // Receive answer event
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

    // Handle ICE candidates
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
    <div className="min-h-screen flex flex-col items-center p-4 overflow-scroll">
      <div className="text-center mb-4">
        {lobby && (
          <div className="flex justify-center">
            <h2 className="text-muted-foreground font-semibold">
              Waiting in the lobby
            </h2>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-4xl justify-center">
        <div className="flex justify-center w-full md:h-full sm:aspect-square">
          <video
            autoPlay
            className="w-full h-full object-cover rounded-lg shadow-md"
            ref={localVideoRef}
          />
        </div>
        <div className="flex justify-center w-full md:h-full sm:aspect-square">
          <video
            autoPlay
            className="w-full h-full object-cover rounded-lg shadow-md"
            ref={remoteVideoRef}
          />
        </div>
      </div>
      <div className="flex justify-between w-full max-w-2xl px-4 py-4 mx-auto">
          <Button className="mb-2 md:mb-0">Exit</Button>
          <Button>
            Next <ChevronRight />
          </Button>
      </div>
    </div>
  );
};

export default RoomPage;
