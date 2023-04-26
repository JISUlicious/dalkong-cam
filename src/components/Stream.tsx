import {useEffect, useRef} from "react";


interface RTCStream {
  stream: MediaStream | undefined
}

export function Stream({stream}: RTCStream) {
  const streamRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!streamRef.current)
      return;
    streamRef.current.srcObject = stream ? stream : null;
  }, [stream]);

  return (<video className="local-stream" ref={streamRef} autoPlay controls/>);
}

