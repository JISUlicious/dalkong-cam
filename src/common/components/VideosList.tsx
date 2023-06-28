import React from "react";
import { VideoItem } from "../../viewer/components/VideoItem";

export interface VideosData {
  timestamp: number,
  path: string,
  deviceName: string,
  url: string
}

interface VideosListProps {
  videos: Record<string, VideosData>
}

export function VideosList ({videos}: VideosListProps) {

  return <ul>
  {Object.entries(videos).map(([id, data]) => {
    return <li key={id}><VideoItem title={String(new Date(data.timestamp))} url={data.url} /></li>;
  })}
</ul>
}