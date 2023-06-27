import React, { ChangeEvent } from "react";
import { FiVolume2, FiVolumeX, FiMic, FiMicOff } from "react-icons/fi";


import { ConnectionActionCreator, DeviceState, useConnectionContext, useConnectionDispatchContext } from "../contexts/ConnectionContext";
import { useCameras } from "../hooks/useCameras";
import { getMedia } from "../functions/getMedia";

interface ControlsProps {
  device: DeviceState | null | undefined
}

export function Controls ({device}: ControlsProps) {
  const {localDevice, localStreamAttributes, remoteStreamsAttributes} = useConnectionContext();
  const dispatch = useConnectionDispatchContext();
  const cameras = useCameras();
  
  function onToggleMic () {
    dispatch(ConnectionActionCreator.toggleMic());
  }

  function onToggleSpeaker () {
    dispatch(ConnectionActionCreator.toggleSpeaker(device!.id));
  }

  function onCameraChange (event: ChangeEvent<HTMLSelectElement>) {
    const deviceId = event.target.value;
    getMedia(deviceId).then(stream => {
      dispatch(ConnectionActionCreator.setLocalStream(stream));
    });
  }

  return <div className="controls">
    <button className="icon-button" onClick={onToggleMic}>
      {localStreamAttributes.audioEnabled
        ? <FiMic className="icon mic" />
        : <FiMicOff className="icon mic" />
      }
    </button>
    
    {localDevice?.data()?.deviceType === "viewer" 
      ? <button className="icon-button" onClick={onToggleSpeaker}>
        {!remoteStreamsAttributes[device!.id]?.audioEnabled
        ? <FiVolumeX className="icon speaker" />
        : <FiVolume2 className="icon speaker" />}
      </button>
      : null
    }
    
    {localDevice?.data()?.deviceType === "camera" 
      ? <select className="camera-select" onChange={onCameraChange} >
        {Object.entries(cameras).map(([deviceId, camera]) => {
          return (<option key={deviceId} value={deviceId}>{camera.label}</option>);
        })}
      </select>
      : null
    }

  </div>
}