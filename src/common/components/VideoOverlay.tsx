import React from "react";

import { Controls } from "./Controls";

import { DeviceState } from "../contexts/ConnectionContext";

interface VideoOverlayProps {
  stream: MediaStream | null | undefined,
  device: DeviceState | null
}

export function VideoOverlay({stream, device}: VideoOverlayProps) {
  return (<div className="video-overlay">
    <Controls stream={stream} device={device}/>
    <h1 className="camera-name">{device?.data()?.deviceName}</h1>
  </div>);
}