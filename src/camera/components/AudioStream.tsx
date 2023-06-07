import React, { useEffect, useRef } from "react";

interface RTCStream {
  stream: MediaStream | null | undefined
}

export function AudioStream({stream}: RTCStream) {
  const streamRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (!streamRef.current || !stream)
      return;
    streamRef.current.srcObject = stream;
  }, [stream]);
  console.log("stream", stream);

  return (<audio className="stream" ref={streamRef} autoPlay />);
}

