import { Dispatch, useEffect } from "react";

export function useRecording (track: MediaStreamTrack, setCaptured: Dispatch<React.SetStateAction<any>>) {
  const timeInMs = 1000;
  useEffect(() => {
    const interval = setInterval(() => {
      console.log(`Captures every ${timeInMs/1000} sec`);
      
    }, timeInMs);
  
    return () => clearInterval(interval);
  }, []);
}