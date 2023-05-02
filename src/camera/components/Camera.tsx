import React from "react";
import "../../common/styles/Camera.scss";
import {useParams} from "react-router-dom";
import {VideoItem} from "../../viewer/components/VideoItem";
import {Stream} from "../../common/components/Stream";
import {useEffect} from "react";
import {getMedia} from "../../common/functions/getMedia";
import {StreamActionCreator, useStreamContext, useStreamDispatchContext} from "../../common/contexts/StreamContext";
import {Controls} from "../../common/components/Controls";

export function Camera () {
  const {cameraId} = useParams();
  const {stream} = useStreamContext();
  const dispatch = useStreamDispatchContext();
  const savedTimes = ["2023-02-01 12:00:00", "2023-02-01 12:05:00", "2023-02-01 12:10:00", "a", "ddd", "aaa"];

  useEffect(() => {
    getMedia().then((mediaFromDevice) => {
      dispatch?.(StreamActionCreator.setStream(mediaFromDevice));
    });

    return () => {
      stream?.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }, []);

  return (<div className="camera body-content">
    <div className="video-wrapper">
      <div className="video-overlay">
        <Controls />
        <h1 className="camera-name">camera {cameraId}</h1>
      </div>
      <Stream stream={stream} />
    </div>
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