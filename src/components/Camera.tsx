import "../styles/Camera.scss";
import {useParams} from "react-router-dom";
import {VideoItem} from "./VideoItem";
import {Stream} from "./Stream";
import {useEffect, useState} from "react";
import {getMedia} from "../functions/getMedia";

export function Camera () {
  const cameraId = useParams();
  const [stream, setStream] = useState<MediaStream>();
  const savedTimes = ["2023-02-01 12:00:00", "2023-02-01 12:05:00", "2023-02-01 12:10:00", "a", "ddd", "aaa"];

  useEffect(() => {
    getMedia().then((mediaFromDevice) => {
      console.log(mediaFromDevice);
      setStream(mediaFromDevice);
    });

  }, []);

  return (<div className="camera body-content">
    <h1 className="camera-name">camera {cameraId.cameraId}</h1>
    <Stream stream={stream}/>
    <div className="saved-videos local">
      list of videos
      <ul>
        {savedTimes.map((time, i) => {
          return (<li key={i}>
            <VideoItem title={time} url={`/saved-video/${time}`} />
          </li>);
        })}
      </ul>
    </div>
  </div>);
}