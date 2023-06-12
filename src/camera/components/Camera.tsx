import "../../common/styles/Camera.scss";

import React, { useEffect } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";

import { VideoItem } from "../../viewer/components/VideoItem";
import { Stream } from "../../common/components/Stream";
import { VideoOverlay } from "../../common/components/VideoOverlay";
import { AudioItem } from "./AudioItem";

import { useAuthContext } from "../../common/contexts/AuthContext";
import { 
  ConnectionActionCreator,
  DeviceState, 
  useConnectionContext, 
  useConnectionDispatchContext
} from "../../common/contexts/ConnectionContext";

import { db } from "../../common/functions/firebaseInit";
import { getMedia } from "../../common/functions/getMedia";


export function Camera () {
  const {user} = useAuthContext();
  const {localDevice, localStream, remoteDevices} = useConnectionContext();
  const dispatch = useConnectionDispatchContext();
  
  const savedTimes = ["2023-02-01 12:00:00", "2023-02-01 12:05:00", "2023-02-01 12:10:00", "a", "ddd", "aaa", "g"];

  useEffect(() => {
    if (!localStream?.active) {
      getMedia().then(localMedia => {
        dispatch(ConnectionActionCreator.setLocalStream(localMedia));
      });
    }
  }, []);
  
  useEffect(() => {
    if (user && localDevice && localStream) {
      const key = `users/${user.uid}/cameras/${localDevice.id}`;
      const viewersQuery = query(
        collection(db, key, "connections")
      );

      const unsubscribeViewersCollection = onSnapshot(viewersQuery, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            dispatch(ConnectionActionCreator.addRemoteDevice(change.doc as DeviceState));
          } else if (change.type === "removed") {
            dispatch(ConnectionActionCreator.removeRemoteDevice(change.doc.id));
          }
        });
      }, (error) => console.log(error));
      return () => {
        unsubscribeViewersCollection();

        dispatch(ConnectionActionCreator.setLocalDevice(null));
        dispatch(ConnectionActionCreator.setLocalStream(null));
      };
    }
  }, [user, localDevice, localStream]);

  return (<div className="camera body-content">
    <div className="video-wrapper">
      <VideoOverlay device={localDevice}/>
      <Stream stream={localStream} muted={true} />
    </div>
    <div className="remote-media">
      <ul>
        {Object.entries(remoteDevices).map(([id, viewer]) => {
          console.log("viewer", viewer, viewer.data());
          return (<li key={id}>
            <AudioItem viewer={viewer} />
          </li>);
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