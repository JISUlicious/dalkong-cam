import React from "react";
import { VideoItem } from "./VideoItem";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export interface VideosData {
  fullPath: string,
  deviceName: string,
  timestamp: number,
  deviceId: string,
  url: string
}

interface VideosListProps {
  videos: VideosData[]
}



export function VideosList ({videos}: VideosListProps) {

  return (<div className="vstack gap-2 py-2">
    {videos.map((data) => {
      const datetime = new Date(data.timestamp);
      
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      
      const title = new Intl.DateTimeFormat("en-US", options).format(datetime);
      return <div className="container-fluid px-2" key={data.deviceId + data.timestamp}>
        <VideoItem title={title} url={data.url} />
      </div>;
    })}
  </div>);
}