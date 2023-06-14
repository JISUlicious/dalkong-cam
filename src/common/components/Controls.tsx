import React from "react";
import { FiVolume2, FiVolumeX, FiMic, FiMicOff } from "react-icons/fi";

import { ConnectionActionCreator, DeviceState, useConnectionContext, useConnectionDispatchContext } from "../contexts/ConnectionContext";
import { useCameras } from "../hooks/useCameras";

interface ControlsProps {
  device: DeviceState | null | undefined
}

export function Controls ({device}: ControlsProps) {
  const {localStreamAttributes, remoteStreamsAttributes} = useConnectionContext();
  const dispatch = useConnectionDispatchContext();
  const [cameras, currentCamera, setCurrentCamera] = useCameras();

  function onToggleMic () {
    dispatch(ConnectionActionCreator.toggleMic());
  }

  function onToggleSpeaker () {
    dispatch(ConnectionActionCreator.toggleSpeaker(device!.id));
  }

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
      {cameras.map((camera, i) => {
        const selected = camera.deviceId === currentCamera?.deviceId ? true : false;
        return (<option key={camera.deviceId} value={camera.deviceId} selected={selected}>{camera.label}</option>);
      })}
    </select>

  </div>
}