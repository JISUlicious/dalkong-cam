import React, { ChangeEvent, MouseEvent } from "react";

import {BsRecordCircle} from "react-icons/bs";


import { ConnectionActionCreator, DeviceState, useConnectionContext, useConnectionDispatchContext } from "../contexts/ConnectionContext";
import { useCameras } from "../hooks/useCameras";
import { getMedia } from "../functions/getMedia";
import { FiMic, FiMicOff, FiVolume2, FiVolumeX } from "react-icons/fi";

interface VideoOverlayProps {
  device: DeviceState | null
}

function onClick (event: MouseEvent) {
  event.stopPropagation();
}


export function StreamOverlay({device}: VideoOverlayProps) {
  const {localDevice, localStreamAttributes, remoteStreamsAttributes} = useConnectionContext();
  const dispatch = useConnectionDispatchContext();
  const cameras = useCameras();
  
  function onToggleMic (event: MouseEvent) {
    event.stopPropagation();
    dispatch(ConnectionActionCreator.toggleMic());
  }

  function onToggleSpeaker (event: MouseEvent) {
    event.stopPropagation();
    dispatch(ConnectionActionCreator.toggleSpeaker(device!.id));
  }

  function onCameraChange (event: ChangeEvent<HTMLSelectElement>) {
    const deviceId = event.target.value;
    getMedia(deviceId).then(stream => {
      dispatch(ConnectionActionCreator.setLocalStream(stream));
    });
  }


  return (<div className="stream-overlay container-fluid position-absolute top-0 start-0 z-3 px-0" onClick={onClick}>
    <div className="row gx-1 m-1">
      <div className="col-auto">
        <button className="icon-button btn btn-outline-primary" onClick={onToggleMic}>
          {localStreamAttributes.audioEnabled
            ? <FiMic className="icon mic" />
            : <FiMicOff className="icon mic" />
          }
        </button>
      </div>
      {localDevice?.data()?.deviceType === "viewer" 
        ? <div className="col-auto">
          <button className="icon-button btn btn-outline-primary" onClick={onToggleSpeaker}>
            {!remoteStreamsAttributes[device!.id]?.audioEnabled
            ? <FiVolumeX className="icon speaker" />
            : <FiVolume2 className="icon speaker" />}
          </button>
        </div>
        : null
      }
      
      {localDevice?.data()?.deviceType === "camera" 
        ? <div className="col-auto">
          <select className="camera-select form-select" aria-label="Default select example" onChange={onCameraChange} >
          {Object.entries(cameras).map(([deviceId, camera]) => {
            return (<option key={deviceId} value={deviceId}>{camera.label}</option>);
          })}
        </select>
        </div>
        : null
      }
      <div className="col flex-grow-1"></div>
      {device?.data()?.isRecording 
        ? <div className="col-auto px-2 text-danger fs-4 d-flex align-items-center">
            <BsRecordCircle className="recording" />
        </div>
        : null
      }
    </div>
  </div>);
}