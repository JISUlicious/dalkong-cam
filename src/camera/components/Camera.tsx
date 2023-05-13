import "../../common/styles/Camera.scss";
import { useParams } from "react-router-dom";
import { VideoItem } from "../../viewer/components/VideoItem";
import { Stream } from "../../common/components/Stream";
import React, { useEffect } from "react";
import { getMedia } from "../../common/functions/getMedia";
import {
  CameraState,
  StreamActionCreator,
  useStreamContext,
  useStreamDispatchContext
} from "../../common/contexts/StreamContext";
import { useAuthContext } from "../../common/contexts/AuthContext";
import { VideoOverlay } from "../../common/components/VideoOverlay";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../../common/functions/firebaseInit";
import { AudioItem } from "./AudioItem";
import { removeItem } from "../../common/functions/storage";


export function Camera () {
  const {user} = useAuthContext();
  const {cameraId} = useParams();
  const {camera, localStream, remoteCameras} = useStreamContext();
  const dispatch = useStreamDispatchContext();
  const savedTimes = ["2023-02-01 12:00:00", "2023-02-01 12:05:00", "2023-02-01 12:10:00", "a", "ddd", "aaa"];

  useEffect(() => {
    async function getLocalStream() {
      if (!localStream || !localStream?.active) {
        const media = await getMedia();
        dispatch?.(StreamActionCreator.setLocalStream(media));
      }
    }

    getLocalStream();

    return () => {
      dispatch(StreamActionCreator.setLocalStream(null));
    };
  }, []);
  
  useEffect(() => {
    const key = `users/${user?.uid}/cameras/${cameraId}`;
    const viewersQuery = query(
      collection(db, key, "viewers")
    );

    const unsubscribeViewersCollection = onSnapshot(viewersQuery, async (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          dispatch(StreamActionCreator.addRemoteCamera(change.doc as CameraState));
        }
      });
    }, (error) => console.log(error));

    return () => {
      unsubscribeViewersCollection();
      removeItem(`users/${user?.uid}/cameras/${cameraId}`);
      dispatch(StreamActionCreator.clearRemoteCameras());
    };
  }, []);

  return (<div className="camera body-content">
    <div className="video-wrapper">
      <VideoOverlay stream={localStream} camera={camera}/>
      <Stream stream={localStream} />
    </div>
    <div className="remote-media">
      <ul>
        {Object.entries(remoteCameras).map(value => {
          console.log(value);
          if (value[0]) {
            return (<li key={value[0]}>
              <AudioItem viewer={value[1]}/>
            </li>)
          }
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