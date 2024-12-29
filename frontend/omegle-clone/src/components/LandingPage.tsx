import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";
import RoomPage from "./RoomPage";

const LandingPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [userName, setUserName] = useState("");
  const [joined, setJoined] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<MediaStreamTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<MediaStreamTrack | null>(null);

  const getMedia = async () => {
    const stream = await window.navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const video = stream.getVideoTracks()[0];
    const audio = stream.getAudioTracks()[0];

    setLocalVideoTrack(video);
    setLocalAudioTrack(audio);

    if (!videoRef.current) {
      return;
    }

    videoRef.current.srcObject = new MediaStream([video]);
    videoRef.current.play();
  };

  useEffect(() => {
    if (videoRef && videoRef.current) {
      getMedia();
    }
  }, []);

  if (!joined) {
    return (
      <div className="flex justify-center items-center  p-4">
        <Card className="w-full max-w-md rounded-lg shadow-lg">
          <CardHeader>
            <CardDescription className="text-lg font-semibold text-center">
              Your Friendly Space for Video Chats!
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <video
              autoPlay
              ref={videoRef}
              className="w-full rounded-lg mb-4"
            ></video>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5 w-full">
                <Label htmlFor="name" className="text-left">
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setJoined(true)} className="w-full">
              Join
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  return (
    <RoomPage
      userName={userName}
      localAudioTrack={localAudioTrack}
      localVideoTrack={localVideoTrack}
    />
  );
};

export default LandingPage;
