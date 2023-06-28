import React, { ForwardedRef, forwardRef } from "react";
import { DeviceState } from "../contexts/ConnectionContext";
import { StreamOverlay } from "./StreamOverlay";

interface StreamWithControlsProps {
  device: DeviceState | null,
  muted?: boolean
}

export const StreamWithControls = forwardRef(function StreamWithControls (
  props: StreamWithControlsProps, 
  streamRef: ForwardedRef<HTMLVideoElement> 
  ) {
  const {device, muted} = props;

  return (<div className="stream-wrapper">
      <StreamOverlay device={device}/>
      <video className="stream" ref={streamRef} autoPlay muted={muted} />
    </div>);  
});