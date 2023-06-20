import React, { ForwardedRef, RefObject, forwardRef, useEffect, useRef } from "react";
import { DeviceState } from "../contexts/ConnectionContext";
import { VideoOverlay } from "./VideoOverlay";
import { Stream } from "./Stream";

interface VideoWithControlsProps {
  device: DeviceState | null,
  stream: MediaStream | null,
  muted?: boolean
}

export const VideoWithControls = forwardRef(function VideoWithControls (
  props: VideoWithControlsProps, 
  streamRef: ForwardedRef<HTMLVideoElement> 
  ) {
  // const streamRef = useRef<HTMLVideoElement>(null);
  const {device, stream, muted} = props;
  // useEffect(() => {
  //   if (!streamRef.current || !stream)
  //     return;
  //   streamRef.current.srcObject = stream;
  // }, [stream]);
    
  return (<div className="video-wrapper">
      <VideoOverlay device={device}/>
      <video className="stream" ref={streamRef} autoPlay muted={muted}>
        <source src={stream?.id} />
        </video>
      {/* <Stream stream={stream} muted={muted} /> */}
    </div>);  
})
// export function VideoWithControls ({device, stream, muted}: VideoWithControlsProps) {
//   const streamRef = useRef<HTMLVideoElement>(null);
//   useEffect(() => {
//     if (!streamRef.current || !stream)
//       return;
//     streamRef.current.srcObject = stream;
//   }, [stream]);
    
//   return (<div className="video-wrapper">
//       <VideoOverlay device={device}/>
//       <video className="stream" ref={streamRef} autoPlay muted={muted}/>
//       {/* <Stream stream={stream} muted={muted} /> */}
//     </div>);  
// }