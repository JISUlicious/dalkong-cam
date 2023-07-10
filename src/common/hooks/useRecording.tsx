import { RefObject, useEffect, useRef, useState } from "react";
import { detectMotion } from "../functions/detectMotion";

export function useRecording (
  videoRef: RefObject<HTMLVideoElement>,
  recorder: MediaRecorder | undefined,
  onRecorderStop: (blob: Blob[], recordingId: number) => Promise<any>
  ): boolean {
  const recordedData = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const recordingId = useRef<number>(0);

  const lastMotionDetectedTime = useRef<number>(0);
  
  const canvas1 = document.createElement("canvas");
  const canvas2 = document.createElement("canvas");
  
  function stopRecording (recorder: MediaRecorder) {
    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = event => reject(event.type);
    });
    console.log("recording stop");
    recorder.stop();

    return stopped;
  }
  
  useEffect(()=>{
    if (recorder && recorder.ondataavailable === null) {
      recorder.ondataavailable = (event) => {
        recordedData.current = [...recordedData.current, event.data];
      };
    }

    if (videoRef.current) {
      const lastCaptureContext = canvas1.getContext('2d', {willReadFrequently: true})!;
      const compositeContext = canvas2.getContext('2d', {willReadFrequently: true})!;
      
      const captureInterval = 100;
      const width = 64;
      const height = 48;
      const recordingBufferTime = 7000;
      canvas1.width = width;
      canvas1.height = height;
      canvas2.width = width;
      canvas2.height = height;

      lastCaptureContext.drawImage(videoRef.current, 0, 0, width, height);

      const interval = setInterval(async ()=>{
        compositeContext.clearRect(0, 0, width, height);
        compositeContext.putImageData(lastCaptureContext.getImageData(0, 0, width, height), 0, 0);
        lastCaptureContext.drawImage(videoRef.current!, 0, 0, width, height);
        compositeContext.drawImage(videoRef.current!, 0, 0, width, height);

        const motionDetected = detectMotion(compositeContext);
        
        if (motionDetected) {
          const motionDetectedTime = Date.now();
          lastMotionDetectedTime.current = motionDetectedTime;
        } 
        
        const date = Date.now(); 
        const timeSinceLastMotion = date - lastMotionDetectedTime.current;

        if (timeSinceLastMotion < recordingBufferTime && recorder?.state === "inactive") {
          recorder.start();
          console.log("recording start");
          setIsRecording(true);
          recordingId.current = lastMotionDetectedTime.current;
        } else if (timeSinceLastMotion > recordingBufferTime && recorder?.state === "recording") {
          stopRecording(recorder)
            .then(() => onRecorderStop(recordedData.current, recordingId.current))
            .finally(() => {
              recordedData.current = [];
              setIsRecording(false);
            });
        }
      }, captureInterval);
      return () => {
        compositeContext.clearRect(0, 0, width, height);
        clearInterval(interval);
      };
    }
  }, [videoRef, recorder]);
  return isRecording;
}