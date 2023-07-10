import "../../common/styles/VideoItem.scss";

import React from "react";

interface SavedVideoProps {
  title: string,
  url: string
}

export function VideoItem ({title, url}: SavedVideoProps) {
  return (<div className="video-item">
    <h6 className="video-title">{title}</h6>
    <video crossOrigin="anonymous" className="video-item-content" src={url} controls></video>
  </div>);
}