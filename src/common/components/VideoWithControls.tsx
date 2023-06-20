import React, { ForwardedRef, forwardRef } from "react";
import { DeviceState } from "../contexts/ConnectionContext";
import { VideoOverlay } from "./VideoOverlay";

interface VideoWithControlsProps {
  device: DeviceState | null,
  muted?: boolean
}

export const VideoWithControls = forwardRef(function VideoWithControls (
  props: VideoWithControlsProps, 
  streamRef: ForwardedRef<HTMLVideoElement> 
  ) {
  const {device, muted} = props;

  return (<div className="video-wrapper">
      <VideoOverlay device={device}/>
      <video className="stream" ref={streamRef} autoPlay muted={muted} />
    </div>);  
});