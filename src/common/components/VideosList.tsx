import React from "react";
import { VideoItem } from "./VideoItem";

export interface VideosData {
  fullPath: string,
  deviceName: string,
  timestamp: number,
  deviceId: string,
  url: string,
  duration: number
}

interface VideosListProps {
  videos: VideosData[]
}

export function VideosList ({videos}: VideosListProps) {

  return (<ul>
    {videos.map((data) => {
      return <li key={data.deviceId + data.timestamp}>
        <VideoItem title={String(new Date(data.timestamp))} url={data.url} duration={data.duration} />
      </li>;
    })}
  </ul>);
}