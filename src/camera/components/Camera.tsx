import "../../common/styles/Camera.scss";

import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
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
import { removeItem } from "../../common/functions/storage";
import { getMedia } from "../../common/functions/getMedia";



export function Camera () {
  const {user} = useAuthContext();
  const {cameraId} = useParams();
  const {localDevice, localStream, remoteDevices, remoteStreams} = useConnectionContext();
  const dispatch = useConnectionDispatchContext();
  const savedTimes = ["2023-02-01 12:00:00", "2023-02-01 12:05:00", "2023-02-01 12:10:00", "a", "ddd", "aaa"];


  // get local stream
  // listen for doc change
  //  -> new doc => answer to the connection, store connection in context
  // unsubscribe
  // remove doc
  // close connection

  useEffect(() => {
    async function getLocalStream() {
      if (!localStream || !localStream?.active) {
        const media = await getMedia();
        dispatch?.(ConnectionActionCreator.setLocalStream(media));
      }
    }

    getLocalStream();

    return () => {
      dispatch(ConnectionActionCreator.setLocalStream(null));
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
          dispatch(ConnectionActionCreator.addRemoteDevice(change.doc as DeviceState));
        }
      });
    }, (error) => console.log(error));

    return () => {
      unsubscribeViewersCollection();
      removeItem(`users/${user?.uid}/cameras/${cameraId}`);
      dispatch(ConnectionActionCreator.clearRemoteDevices());


      for (const id in remoteStreams) {
        dispatch(ConnectionActionCreator.removeRemoteStream(id));
      }
      dispatch(ConnectionActionCreator.clearRemoteDevices());

    };
  }, []);

  return (<div className="camera body-content">
    <div className="video-wrapper">
      <VideoOverlay stream={localStream} device={localDevice}/>
      <Stream stream={localStream} />
    </div>
    <div className="remote-media">
      <ul>
        {Object.entries(remoteDevices).map(([id, viewer]) => {
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