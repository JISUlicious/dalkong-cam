import "../../common/styles/VideoItem.scss";

import React, { useEffect, useRef, useState } from "react";

interface SavedVideoProps {
  title: string,
  url: string,
  duration?: number
}

export function VideoItem ({title, url, duration}: SavedVideoProps) {
  const [initialRender, setInitialRender] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && duration && initialRender) {
      videoRef.current.currentTime = duration / 1000 + 5;
    } else if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = 0;
    }
  }, [initialRender, videoRef.current?.duration]);
  return (<div className="video-item">
    <h6 className="video-title">{title}</h6>
    <video ref={videoRef} className="video-item-content" src={url} controls></video>
  </div>);
}