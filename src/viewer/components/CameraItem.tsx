import React, { useCallback, useEffect, useRef, useState } from "react";

import { 
  DeviceState, 
  useConnectionContext
} from "../../common/contexts/ConnectionContext";
import { StreamWithControls } from "../../common/components/StreamWithControls";
import { where } from "firebase/firestore";
import { VideosList } from "../../common/components/VideosList";
import { useTimeOrderedVideos } from "../../common/hooks/useTimeOrderedVideos";


interface CameraItemProps {
  camera: DeviceState
}

export function CameraItem({camera}: CameraItemProps) {
  
  const {remoteStreams} = useConnectionContext();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const videosData = useTimeOrderedVideos(
    where("deviceId", "==", camera.id), 
    );

  const streamRef = useRef<HTMLVideoElement>(null);
  const cameraItemRef = useRef<HTMLDivElement>(null);
  const doc = useRef(document);
  
  const onClickStream = useCallback((event: MouseEvent) => {
    if (isFullscreen) {
      doc.current.exitFullscreen();
      setIsFullscreen(false);
    } else {
      cameraItemRef.current?.requestFullscreen();
      setIsFullscreen(true);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.addEventListener("click", onClickStream);
      return () => {
        streamRef.current?.removeEventListener("click", onClickStream);
      }
    }
  }, [streamRef, isFullscreen]);

  useEffect(() => {
    if (remoteStreams?.[camera?.id]) {
      if (!streamRef.current || !remoteStreams?.[camera?.id])
        return;
      streamRef.current.srcObject = remoteStreams?.[camera?.id];
    }
  }, [remoteStreams?.[camera?.id]]);
  
  return (<div className={`camera-item container px-0 ${isFullscreen ? "overflow-y-auto" : ""}`} ref={cameraItemRef}>
    <StreamWithControls ref={streamRef} device={camera} />
    { isFullscreen ? <VideosList videos={videosData} /> : null }
  </div>);
}