import React from "react";
import { FiVolume2, FiVolumeX, FiMic, FiMicOff } from "react-icons/fi";

import { ConnectionActionCreator, DeviceState, useConnectionContext, useConnectionDispatchContext } from "../contexts/ConnectionContext";

interface ControlsProps {
  stream: MediaStream | null | undefined,
  device: DeviceState | null | undefined
}

export function Controls ({stream, device}: ControlsProps) {
  const {localStream, localStreamAttributes, remoteStreamsAttributes} = useConnectionContext();
  const dispatch = useConnectionDispatchContext();

  function onToggleMic () {
    dispatch(ConnectionActionCreator.toggleMic());
  }

  function onToggleSpeaker () {
    dispatch(ConnectionActionCreator.toggleSpeaker(device!.id));
  }
  console.log("remote", remoteStreamsAttributes[device!.id]?.audioEnabled)
  console.log("local", localStreamAttributes.audioEnabled)
  return <div className="controls">
    <button className="icon-button" onClick={onToggleMic}>
      {localStreamAttributes.audioEnabled
        ? <FiMic className="icon mic" />
        : <FiMicOff className="icon mic" />
      }
    </button>
    <button className="icon-button" onClick={onToggleSpeaker}>
      {!remoteStreamsAttributes[device!.id]?.audioEnabled
        ? <FiVolumeX className="icon speaker" />
        : <FiVolume2 className="icon speaker" />
      }
    </button>
    <select className="camera-select">
      <option value="default">default</option>
      <option value="second">second</option>
      <option value="list-of-cameras">list of cameras...</option>
    </select>

  </div>
}