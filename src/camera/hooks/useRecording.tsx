import { Dispatch, RefObject, useEffect } from "react";
import { detectMotion, timer } from "../../common/functions/detectMotion";
import { Action, ConnectionActionCreator, StreamAttributes } from "../../common/contexts/ConnectionContext";
import { time } from "console";

export function useRecording (
  canvasRef: RefObject<HTMLCanvasElement>, 
  streamRef: RefObject<HTMLVideoElement>,
  localStreamAttributes: StreamAttributes,
  recorder: MediaRecorder | undefined,
  dispatch: Dispatch<Action>,
  ) {
  useEffect(()=>{
    if (canvasRef && streamRef) {
      const canvas = canvasRef.current;
      const context = canvasRef.current?.getContext('2d');
      
      const captureInterval = 100;
      const width = 64;
      const height = 48;
      
      canvas!.style.display = "none";
      canvas!.width = width;
      canvas!.height = height;

      const interval = setInterval(async ()=>{
        context?.drawImage(streamRef.current!, 0, 0, width, height);   
        await timer(captureInterval);
        context?.drawImage(streamRef.current!, 0, 0, width, height);
        
        const motionDetected = await detectMotion(context);
        
        if (motionDetected) {
          const motionDetectedTime = new Date();
          dispatch(ConnectionActionCreator.setIsRecording(motionDetected, motionDetectedTime));
        } else {
          dispatch(ConnectionActionCreator.setIsRecording(motionDetected, null));
        }
        
        context?.clearRect(0, 0, width, height);
      }, captureInterval);
      return () => {
        context?.clearRect(0, 0, width, height);
        clearInterval(interval);
      };
    }
  }, [canvasRef, streamRef]);

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
      } 
    }

  }, [localStreamAttributes]);
}