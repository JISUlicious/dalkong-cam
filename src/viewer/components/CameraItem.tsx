import React, { useCallback, useEffect, useRef, useState } from "react";

import { 
  DeviceState, 
  useConnectionContext
} from "../../common/contexts/ConnectionContext";
import { StreamWithControls } from "../../common/components/StreamWithControls";
import { useSavedVideos } from "../../common/hooks/useSavedVideos";
import { orderBy, where } from "firebase/firestore";
import { VideosList } from "../../common/components/VideosList";


interface CameraItemProps {
  camera: DeviceState
}

export function CameraItem({camera}: CameraItemProps) {
  
  const {remoteStreams} = useConnectionContext();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [videosData, setVideosData] = useSavedVideos(
    where("deviceId", "==", camera.id), 
    orderBy("timestamp")
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
    if (cameraItemRef.current) {
      cameraItemRef.current.addEventListener("click", onClickStream);
      return () => {
        cameraItemRef.current?.removeEventListener("click", onClickStream);
      }
    }
  }, [cameraItemRef, isFullscreen]);

  useEffect(() => {
    if (remoteStreams?.[camera?.id]) {
      if (!streamRef.current || !remoteStreams?.[camera?.id])
        return;
      streamRef.current.srcObject = remoteStreams?.[camera?.id];
    }
  }, [remoteStreams?.[camera?.id]]);
  
  return (<div className={`camera-item ${isFullscreen ? "fullscreen" : ""}`} ref={cameraItemRef}>
    <StreamWithControls ref={streamRef} device={camera} />
    { isFullscreen ? <VideosList videos={videosData} /> : null }
  </div>);
}