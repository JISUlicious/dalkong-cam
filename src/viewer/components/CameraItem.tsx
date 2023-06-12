import React from "react";
import { useNavigate } from "react-router-dom";

import { Stream } from "../../common/components/Stream";

import { 
  DeviceState, 
  useConnectionContext
} from "../../common/contexts/ConnectionContext";
import { VideoOverlay } from "../../common/components/VideoOverlay";


interface CameraItemProps {
  camera: DeviceState
}

export function CameraItem({camera}: CameraItemProps) {
  
  const {remoteStreams, localDevice} = useConnectionContext();

  const navigate = useNavigate();

  function onClick () {
    // navigate(`/viewer/${localDevice?.id}/camera/${camera.id}`); // TODO: make route
  }

  return (<div className="camera-item video-wrapper" onClick={onClick}>
    {/* <h1>{camera.data()?.deviceName}</h1>
    <Stream stream={remoteStreams?.[camera?.id]} /> */}
    
      <VideoOverlay stream={remoteStreams?.[camera?.id]} device={localDevice}/>
      <Stream stream={remoteStreams?.[camera?.id]} />

  </div>);
}