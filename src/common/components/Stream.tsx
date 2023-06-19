import React, { useEffect, useRef } from "react";
import { useVideoElement } from "../hooks/useVideoElement";

interface RTCStream {
  stream: MediaStream | null | undefined,
  muted?: boolean
}

export function Stream({stream, muted}: RTCStream) {
  const streamRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!streamRef.current || !stream)
      return;
    streamRef.current.srcObject = stream;
  }, [stream]);
  

  return (<video className="stream" ref={streamRef} autoPlay muted={muted}/>);
}

