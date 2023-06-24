import { Dispatch, RefObject, useEffect } from "react";
import { detectMotion, timer } from "../../common/functions/detectMotion";
import { Action, ConnectionActionCreator } from "../../common/contexts/ConnectionContext";

export function useRecording (
  canvasRef: RefObject<HTMLCanvasElement>, 
  streamRef: RefObject<HTMLVideoElement>,
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
        
        const isRecording = await detectMotion(context);
        dispatch(ConnectionActionCreator.setIsRecording(isRecording));
        
        context?.clearRect(0, 0, width, height);
      }, captureInterval * 2);
      return () => clearInterval(interval);
    }
  }, [canvasRef, streamRef]);
}