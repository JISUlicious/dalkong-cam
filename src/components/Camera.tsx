import "../styles/Camera.scss";
import {useParams} from "react-router-dom";
import {VideoItem} from "./VideoItem";

export function Camera () {
  const cameraId = useParams();

  const savedTimes = ["2023-02-01 12:00:00", "2023-02-01 12:05:00", "2023-02-01 12:10:00", "a", "ddd", "aaa"];

  return (<div className="camera body-content">
    <h1 className="camera-name">camera {cameraId.cameraId}</h1>
    <video className="local-stream">local video</video>
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