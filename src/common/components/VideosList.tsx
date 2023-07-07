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
      const year = datetime.getFullYear();
      const month = datetime.getMonth();
      const date = datetime.getDate();
      const hour = datetime.getHours();
      const minute = datetime.getMinutes();
      const second = datetime.getSeconds();

      const title = `${monthNames[month]} ${date} ${year} ${hour}:${minute < 10 ? `0${minute}` : minute}:${second < 10 ? `0${second}` : second}`;
      return <div className="container-fluid px-2" key={data.deviceId + data.timestamp}>
        <VideoItem title={title} url={data.url} />
      </div>;
    })}
  </div>);
}