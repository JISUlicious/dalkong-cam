import React, { useEffect, useRef } from "react";

interface RTCStream {
  stream: MediaStream | null | undefined
}

export function Stream({stream}: RTCStream) {
  const streamRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!streamRef.current || !stream)
      return;
    streamRef.current.srcObject = stream;
  }, [stream]);

  return (<video className="stream" ref={streamRef} autoPlay muted />);
}

