import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
      <div className="flex justify-center items-center h-screen">
        <Card className="w-[90%] max-w-[350px]">
          <CardHeader>
            <CardTitle>Vomegle</CardTitle>
            <CardDescription>
              Start chatting with random people.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <video autoPlay ref={videoRef}></video>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Name of your project"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                  }}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              onClick={() => setJoined(true)}
            >
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
