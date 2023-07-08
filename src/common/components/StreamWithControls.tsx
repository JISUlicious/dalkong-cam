import React, { ForwardedRef, forwardRef } from "react";
import { DeviceState } from "../contexts/ConnectionContext";
import { StreamOverlay } from "./StreamOverlay";

interface StreamWithControlsProps {
  device: DeviceState | null,
  muted?: boolean
}

export const StreamWithControls = forwardRef(function StreamWithControls (
  props: StreamWithControlsProps, 
  videoRef: ForwardedRef<HTMLVideoElement> 
  ) {
  const {device, muted} = props;

  return (<div className="stream-wrapper">
      <StreamOverlay device={device}/>
      <video className="stream" ref={videoRef} autoPlay muted={muted} />
    </div>);  
});