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
  return <button className="remote-viewer btn disabled" style={{backgroundColor:hslColorKey}}>
    {viewer.data()?.deviceName.charAt(0)}
    <AudioStream stream={remoteStreams?.[viewer.id]} />
  </button>
}