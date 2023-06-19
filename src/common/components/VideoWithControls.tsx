import React from "react";
import { DeviceState } from "../contexts/ConnectionContext";

interface VideoWithControlsProps {
  device: DeviceState | null,
  stream: MediaStream | null,
  muted?: boolean
}

export function VideoWithControls ({device, stream, muted}: VideoWithControlsProps) {

  return <div className="video-wrapper">
      {/* <VideoOverlay device={device}/>
      <Stream stream={stream} muted={muted} /> */}
    </div>  
}