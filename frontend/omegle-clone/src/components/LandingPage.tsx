import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
const LandingPage = () => {
    const router = useNavigate()
    const [userName , setUserName] = useState('')
  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-[90%] max-w-[350px]">
        <CardHeader>
          <CardTitle>Vomegle</CardTitle>
          <CardDescription>Start chatting with random people.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Name of your project" value={userName} onChange={(e)=>{
                    setUserName(e.target.value)
                }} />
              </div>
            </div>  
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={()=>{
            router('/room')
          }} >Join</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LandingPage;
