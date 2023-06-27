import React, { MouseEvent } from "react";

import { Controls } from "./Controls";
import {BsRecordCircle} from "react-icons/bs";


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
    {device?.data()?.isRecording 
      ? <button className="icon-button no-border-button">
        <BsRecordCircle className="recording" />
      </button> 
      : null}
    <div className="camera-name">{device?.data()?.deviceName}</div>
  </div>);
}