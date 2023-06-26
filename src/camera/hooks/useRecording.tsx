import { Dispatch, RefObject, useEffect, useState } from "react";
import { detectMotion } from "../../common/functions/detectMotion";
import { Action, ConnectionActionCreator, StreamAttributes } from "../../common/contexts/ConnectionContext";

export function useRecording (
  canvasRef: RefObject<HTMLCanvasElement>, 
  videoRef: RefObject<HTMLVideoElement>,
  localStreamAttributes: StreamAttributes,
  recorder: MediaRecorder | undefined,
  dispatch: Dispatch<Action>,
  ) {
  const [blob, setBlob] = useState<Blob | null>();
  const [lastMotionDetectedTime, setLastMotionDetectedTime] = useState<Date>();
  


  useEffect(() => {
    if (recorder && recorder.ondataavailable === null) {
      recorder.ondataavailable = (event) => {
        setBlob(event.data);
      };
    }
  }, [recorder]);

  useEffect(()=>{
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const context = canvasRef.current.getContext('2d')!;
      
      const captureInterval = 1000;
      const width = 64;
      const height = 48;
      
      // canvas.style.display = "none";
      canvas.width = width;
      canvas.height = height;

      let isEmpty = true;
      const interval = setInterval(async ()=>{
        context.drawImage(videoRef.current!, 0, 0, width, height);  
        if (isEmpty) {
          // code for drawing first image
          isEmpty = false;
        } else {
          // code to draw, compare, clear context
          const motionDetected = detectMotion(context);
          
          if (motionDetected) {
            const motionDetectedTime = new Date();
            dispatch(ConnectionActionCreator.setIsRecording(motionDetected, motionDetectedTime));
          } else {
            dispatch(ConnectionActionCreator.setIsRecording(motionDetected, null));
          }
          
          context?.clearRect(0, 0, width, height);
          isEmpty = true;
          
        }
      }, captureInterval);
      return () => {
        context.clearRect(0, 0, width, height);
        clearInterval(interval);
      };
    }
  }, [canvasRef, videoRef]);

  useEffect(() => {
    
    console.log(localStreamAttributes);
    console.log(recorder);

    // TODO : handle recorded blob, push to storage
    if (localStreamAttributes.isRecording && recorder?.state === "inactive") {
      recorder.start();
    } else if (
      !localStreamAttributes.isRecording 
      && recorder?.state === "recording"
      && localStreamAttributes.lastMotionDetected
      ) {
      const date = new Date(); 
      const timeSinceLastMotion = date.getTime() - localStreamAttributes.lastMotionDetected.getTime();

      if (timeSinceLastMotion > 3000) {
        recorder.stop();
        console.log("stopped");
        console.log(recorder);
        console.log(blob);
        // store blob to storage
        // then
        setBlob(null);
      }
    }

  }, [localStreamAttributes]);
}