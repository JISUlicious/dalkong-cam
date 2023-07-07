import React from "react";

interface SavedVideoProps {
  title: string,
  url: string
}

export function VideoItem ({title, url}: SavedVideoProps) {
  return (<div className="video-item card">
    <div className="video-title card-body py-2">
      {title}
    </div>
    <video className="video-item-content card-img-bottom" src={url} controls></video>
  </div>);
}