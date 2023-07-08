import "../../common/styles/Camera.scss";

import React, { useMemo } from "react";

import { AudioStream } from "./AudioStream";

import { DeviceState, useConnectionContext } from "../../common/contexts/ConnectionContext";


interface RemoteViewer {
  viewer: DeviceState
}

export function AudioItem ({viewer}: RemoteViewer) {
  const {remoteStreams} = useConnectionContext();
  const hslColorKey = useMemo(() => {
    const randomHue = Math.floor(Math.random() * 360);
    const hslColorKey = `hsl(${randomHue} 80% 80%)`;
    return hslColorKey;
  }, [viewer]);
  return <div className="remote-viewer" style={{backgroundColor:hslColorKey}}>
    {viewer.data()?.deviceName.charAt(0)}
    <AudioStream stream={remoteStreams?.[viewer.id]} />
  </div>
}