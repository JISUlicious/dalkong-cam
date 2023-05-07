import "../../common/styles/Camera.scss";
import { useParams } from "react-router-dom";
import { VideoItem } from "../../viewer/components/VideoItem";
import { Stream } from "../../common/components/Stream";
import React, { useEffect, useState } from "react";
import { getMedia } from "../../common/functions/getMedia";
import {
  StreamActionCreator,
  useStreamContext,
  useStreamDispatchContext
} from "../../common/contexts/StreamContext";
import openRelayTurnServer from "../../turnSettings";
import { useAuthContext } from "../../common/contexts/AuthContext";
import { addItem, removeItem, removeItems, updateItem } from "../../common/functions/storage";
import { VideoOverlay } from "../../common/components/VideoOverlay";
import { useCameraDocOnSnapshotChange } from "../../common/hooks/useCameraDocOnSnapshot";
import { useLocalStream } from "../../common/hooks/useLocalStream";

export function Camera () {
  const {user} = useAuthContext();
  const {cameraId} = useParams();
  const {camera, localStream} = useStreamContext();
  const dispatch = useStreamDispatchContext();
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[] | null>(null);
  const savedTimes = ["2023-02-01 12:00:00", "2023-02-01 12:05:00", "2023-02-01 12:10:00", "a", "ddd", "aaa"];

  const connection = new RTCPeerConnection(openRelayTurnServer);

  useCameraDocOnSnapshotChange(user!.uid, cameraId!, connection, dispatch);

  useLocalStream(localStream, dispatch, connection, camera, user);

  connection.addEventListener('icecandidate', event => {
    if (!event.candidate) {
      return;
    }
    const key = `users/${user?.uid}/cameras/${cameraId}/offeringCandidates`; 
    addItem(key, event.candidate.toJSON());
  });
  
  connection.addEventListener('track', async (event: RTCTrackEvent) => {
    console.log(event.streams);
    // TODO:
    // setRemoteStream(event.streams);
  });
  
  return (<div className="camera body-content">
    <div className="video-wrapper">
      <VideoOverlay stream={localStream} camera={camera}/>
      
      <Stream stream={localStream} />
    </div>
    <div className="remote-media">
      <ul>
        {/* TODO: key 적당한 것으로 변경 */}
        {remoteStreams?.map((remoteStream, i) => {
          return (<li key={i}>
            <Stream stream={remoteStream} />
          </li>)
        })}
      </ul>
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