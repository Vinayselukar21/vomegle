import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { Card, CardContent } from "./ui/card";
const SOCKET_SERVER_URL = "http://localhost:3000";
const RoomPage = ({
  userName,
  localVideoTrack,
  localAudioTrack,
}: {
  userName: string;
  localVideoTrack: MediaStreamTrack | null;
  localAudioTrack: MediaStreamTrack | null;
}) => {
  //@ts-ignore
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lobby, setLobby] = useState<boolean>(true);
  //@ts-ignore
  const [sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);
  //@ts-ignore
  const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(
    null
  );
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
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);

    socket.on("send-offer", async ({ roomId }) => {
      console.log("Please send the offer");
      setLobby(false);

      const pc = new RTCPeerConnection();
      setSendingPc(pc);

      if (localVideoTrack) {
        console.log("Adding video track");
        pc.addTrack(localVideoTrack);
      }

      if (localAudioTrack) {
        console.log("Adding audio track");
        pc.addTrack(localAudioTrack);
      }

      pc.onicecandidate = async (e) => {
        console.log("receiving ice candidate locally");
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            roomId,
            type: "sender",
          });
        }
      };

      pc.onnegotiationneeded = async () => {
        console.log("Negotiation needed");
        // Create an SDP (Session Description Protocol) offer for the connection.
        const sdp = await pc.createOffer();
        //@ts-ignore
        pc.setLocalDescription(sdp);
        // Emit the 'offer' event to the server with the room ID and the generated SDP.
        socket?.emit("offer", {
          roomId,
          sdp,
        });
      };
    });

    socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
      console.log("Please send the answer");
      setLobby(false);

      const pc = new RTCPeerConnection();
      pc.setRemoteDescription(remoteSdp);
      const sdp = await pc.createAnswer();
      //@ts-ignore
      pc.setLocalDescription(sdp);
      setReceivingPc(pc);

      const remoteStream = new MediaStream();
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setRemoteMediaStream(remoteStream);

      pc.ontrack = ({ track, type }) => {
        console.log("Inside on track");
        if (type === "audio") {
          // setRemoteAudioTrack(track);
          //@ts-ignore
          remoteVideoRef.current?.srcObject?.addTrack(track);
        } else {
          // setRemoteVideoTrack(track);
          //@ts-ignore
          remoteVideoRef.current?.srcObject?.addTrack(track);
        }
        //@ts-ignore
        remoteVideoRef.current?.play();
      };

      pc.onicecandidate = async (e) => {
        if (!e.candidate) {
          return;
        }
        console.log("omn ice candidate on receiving seide");
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "receiver",
            roomId,
          });
        }
      };

      socket?.emit("answer", {
        roomId,
        sdp,
      });

      setTimeout(() => {
        const track1 = pc.getTransceivers()[0].receiver.track;
        const track2 = pc.getTransceivers()[1].receiver.track;
        console.log(track1);
        if (track1.kind === "video") {
          setRemoteAudioTrack(track2);
          setRemoteVideoTrack(track1);
        } else {
          setRemoteAudioTrack(track1);
          setRemoteVideoTrack(track2);
        }
        //@ts-ignore
        remoteVideoRef.current.srcObject.addTrack(track1);
        //@ts-ignore
        remoteVideoRef.current.srcObject.addTrack(track2);
        //@ts-ignore
        remoteVideoRef.current.play();
        // if (type == 'audio') {
        //     // setRemoteAudioTrack(track);
        //     // @ts-ignore
        //     remoteVideoRef.current.srcObject.addTrack(track)
        // } else {
        //     // setRemoteVideoTrack(track);
        //     // @ts-ignore
        //     remoteVideoRef.current.srcObject.addTrack(track)
        // }
        // //@ts-ignore
      }, 5000);
    });

    socket.on("answer", ({ roomId, sdp: remoteSdp }) => {
      console.log("Connection established", roomId);
      setLobby(false);

      setSendingPc((pc) => {
        pc?.setRemoteDescription(remoteSdp);
        return pc;
      });
      console.log("Loop Closed");
    });

    socket.on("lobby", () => {
      setLobby(true);
    });

    socket.on("add-ice-candidate", ({ candidate, type }) => {
      console.log("add ice candidate from remote");
      console.log({ candidate, type });
      if (type == "sender") {
        setReceivingPc((pc) => {
          if (!pc) {
            console.error("receicng pc nout found");
          } else {
            console.error(pc.ontrack);
          }
          pc?.addIceCandidate(candidate);
          return pc;
        });
      } else {
        setSendingPc((pc) => {
          if (!pc) {
            console.error("sending pc nout found");
          } else {
            // console.error(pc.ontrack)
          }
          pc?.addIceCandidate(candidate);
          return pc;
        });
      }
    });

    setSocket(socket);
  }, [userName]);

  // console.log(socket);
  // console.log(lobby);

  useEffect(() => {
    if (localVideoRef.current && localVideoTrack) {
      if (localVideoTrack) {
        localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
        localVideoRef.current.play();
      }
    }
  }, [localVideoRef]);

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
          <CardContent className="grid grid-cols-2 gap-2 p-4 ">
            <video autoPlay width={400} height={300} ref={localVideoRef} />
            <video autoPlay width={400} height={300} ref={remoteVideoRef} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoomPage;
