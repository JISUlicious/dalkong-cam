import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { 
  DeviceState, 
  useConnectionContext
} from "../../common/contexts/ConnectionContext";
import { StreamWithControls } from "../../common/components/StreamWithControls";


interface CameraItemProps {
  camera: DeviceState
}

export function CameraItem({camera}: CameraItemProps) {
  
  const {remoteStreams} = useConnectionContext();
  const navigate = useNavigate();

  const streamRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (remoteStreams?.[camera?.id]) {
      if (!streamRef.current || !remoteStreams?.[camera?.id])
        return;
      streamRef.current.srcObject = remoteStreams?.[camera?.id];
    }
  }, [remoteStreams?.[camera?.id]]);
  
  function onClick () {
    // navigate(`/viewer/${localDevice?.id}/camera/${camera.id}`); // TODO: make route
  }
  return (<StreamWithControls ref={streamRef} device={camera} />);
}