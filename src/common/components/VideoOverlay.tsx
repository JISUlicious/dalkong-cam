import React from "react";
import { Controls } from "./Controls";
import { CameraState } from "../contexts/StreamContext";

interface VideoOverlayProps {
  stream: MediaStream | null,
  camera: CameraState | null
}

export function VideoOverlay({stream, camera}: VideoOverlayProps) {
  return (<div className="video-overlay">
    <Controls stream={stream}/>
    <h1 className="camera-name">{camera?.data()?.cameraName}</h1>
  </div>);
}