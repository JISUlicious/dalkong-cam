import React from "react";

interface SavedVideoProps {
  title: string,
  url: string
}

export function VideoItem ({title, url}: SavedVideoProps) {
  return (<div className="video-item card border">
    <div className="video-title card-body py-2 bg-body">
      {title}
    </div>
    <video className="video-item-content card-img-bottom" src={url} controls></video>
  </div>);
}