import React, { MouseEvent } from "react";

import { Controls } from "./Controls";

import { DeviceState } from "../contexts/ConnectionContext";

interface VideoOverlayProps {
  device: DeviceState | null
}

function onClick (event: MouseEvent) {
  event.stopPropagation();
}

export function VideoOverlay({device}: VideoOverlayProps) {
  return (<div className="video-overlay" onClick={onClick}>
    <Controls device={device}/>
    <h1 className="camera-name">{device?.data()?.deviceName}</h1>
  </div>);
}