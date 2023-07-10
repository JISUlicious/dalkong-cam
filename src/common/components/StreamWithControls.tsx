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

  return (<div className="stream-wrapper col px-0 bg-black">
    <div className="position-relative container-fluid mx-0 px-0">
      <StreamOverlay device={device}/>
      <video className="stream w-100 d-block" ref={videoRef} autoPlay muted={muted} />
    </div>
    </div>);  
});