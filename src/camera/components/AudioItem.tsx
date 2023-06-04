import React from "react";

import { AudioStream } from "./AudioStream";

import { DeviceState, useConnectionContext } from "../../common/contexts/ConnectionContext";


interface RemoteViewer {
  viewer: DeviceState
}

export function AudioItem ({viewer}: RemoteViewer) {
  const {remoteStreams} = useConnectionContext();
  return <AudioStream stream={remoteStreams?.[viewer.id]} />
}