import {useEffect, useRef} from "react";

interface RTCStream {
  stream: MediaStream | null
}

export function Stream({stream}: RTCStream) {
  const streamRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (!streamRef.current || !stream)
      return;
    streamRef.current.srcObject = stream;

  }, [stream]);

  return (<video className="stream" ref={streamRef} autoPlay />);
}

