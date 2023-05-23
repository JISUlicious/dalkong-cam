import "../../common/styles/Camera.scss";

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, getDoc, onSnapshot, query } from "firebase/firestore";

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
import { addItem, removeItem, removeItems } from "../../common/functions/storage";
import { getMedia } from "../../common/functions/getMedia";
import { setCameraConnection } from "../functions/setCameraConnection";
import { getCameraSubscriptions } from "../functions/getCameraSubscriptions";
import { Subscriptions } from "../../viewer/components/Viewer";
import { clearConnectionById } from "../../viewer/functions/clearConnectionById";



export function Camera () {
  const {user} = useAuthContext();
  const {localDevice, localStream, remoteDevices, connections} = useConnectionContext();
  const dispatch = useConnectionDispatchContext();
  const [subscriptions, setSubscriptions] = useState<Subscriptions>({});
  
  const savedTimes = ["2023-02-01 12:00:00", "2023-02-01 12:05:00", "2023-02-01 12:10:00", "a", "ddd", "aaa", "g"];

  useEffect(() => {
    const key = `users/${user?.uid}/viewers`;
    addItem(key, {}).then(async docRef => {
      const cameraDoc = await getDoc(docRef);
      dispatch(ConnectionActionCreator.setLocalDevice(cameraDoc as DeviceState));
    });
  }, []);

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
        collection(db, key, "viewers")
      );

      const unsubscribeViewersCollection = onSnapshot(viewersQuery, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const viewerDoc = change.doc as DeviceState;
            console.log(viewerDoc);
            dispatch(ConnectionActionCreator.addRemoteDevice(viewerDoc));

            const connection = await setCameraConnection(user?.uid, localDevice.id, viewerDoc.id, dispatch);

            const viewerKey = `users/${user.uid}/cameras/${localDevice.id}/viewers/${viewerDoc.id}`;
            const [unsubscribeDescriptions, unsubscribeICECandidates] = getCameraSubscriptions(
              viewerKey, 
              localStream, 
              connection
              );

            setSubscriptions((prev) => ({
              ...prev,
              [viewerDoc.id]: {
                unsubDescriptions: unsubscribeDescriptions,
                unsubICECandidates: unsubscribeICECandidates
              }
            }));
          }
        });
      }, (error) => console.log(error));
      return () => {
        unsubscribeViewersCollection();
        const cameraKey = `users/${user?.uid}/cameras/${localDevice.id}`;
        for (const id in connections) {
          removeItems(cameraKey + `/viewers/${id}/offeringCandidates`);
          removeItems(cameraKey + `/viewers/${id}/answeringCandidates`);
          removeItems(cameraKey + "/viewers");
          clearConnectionById(id, subscriptions, setSubscriptions, dispatch);
        }

        removeItem(cameraKey);

        dispatch(ConnectionActionCreator.setLocalDevice(null));
        dispatch(ConnectionActionCreator.setLocalStream(null));
      };
    }
  }, [localDevice, localStream]);

  return (<div className="camera body-content">
    <div className="video-wrapper">
      <VideoOverlay stream={localStream} device={localDevice}/>
      <Stream stream={localStream} muted={true} />
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