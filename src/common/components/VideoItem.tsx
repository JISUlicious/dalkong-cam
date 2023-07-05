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
      videoRef.current.currentTime = (duration + 500) / 1000;
    } 
  }, [initialRender]);

  useEffect(() => {
    videoRef.current?.addEventListener("durationchange", () => {
      if (!Number.isNaN(videoRef.current?.duration)
      && Number.isFinite(videoRef.current?.duration)) {
        videoRef.current!.currentTime = 0;
      }
    })
  }, []);
  
  
  return (<div className="video-item">
    <h6 className="video-title">{title}</h6>
    <video ref={videoRef} className="video-item-content" src={url} controls></video>
  </div>);
}