import { useEffect, useRef, useState } from "react";


export function useVideoElement (stream: MediaStream) {
  
  const streamRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!streamRef.current || !stream)
      return;
    streamRef.current.srcObject = stream;
  }, [stream]);
  
  return streamRef;
}