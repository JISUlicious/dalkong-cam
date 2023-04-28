import {useEffect, useRef} from "react";

interface RTCStream {
  stream: MediaStream | null
}

export function Stream({stream}: RTCStream) {
  const streamRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!streamRef.current)
      return;
    streamRef.current.srcObject = stream ? stream : null;
    return () => {
      stream?.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }, [stream]);

  return (<video className="stream" ref={streamRef} autoPlay />);
}

