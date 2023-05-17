import "../../common/styles/Viewer.scss";

import React, { useEffect, useState } from "react";
import { Unsubscribe, collection, getDoc, onSnapshot, query } from "firebase/firestore";

import { CameraItem } from "./CameraItem";

import { useAuthContext } from "../../common/contexts/AuthContext";
import { 
  ConnectionActionCreator,
  DeviceState,
  useConnectionContext, 
  useConnectionDispatchContext
} from "../../common/contexts/ConnectionContext";

import { addItem, removeItem, removeItems} from "../../common/functions/storage";
import { getMedia } from "../../common/functions/getMedia";
import { db } from "../../common/functions/firebaseInit";
import { getViewerSubscriptions } from "../functions/getViewerSubscriptions";
import { setViewerConnection } from "../functions/setViewerConnection";
import { clearConnectionById } from "../functions/clearConnectionById";

export interface Subscriptions {
  [id: string]: {
    unsubDescriptions: Unsubscribe,
    unsubICECandidates: Unsubscribe
  }
}

export function Viewer () {

  const {user} = useAuthContext();
  
  const {localStream, localDevice, remoteDevices, connections} = useConnectionContext();

  const dispatch = useConnectionDispatchContext();

  const [subscriptions, setSubscriptions] = useState<Subscriptions>({});

  useEffect(() => {
    if (!localDevice) {
      const key = `users/${user?.uid}/viewers`;
      addItem(key, {}).then(async docRef => {
        const viewerDoc = await getDoc(docRef);
        dispatch(ConnectionActionCreator.setLocalDevice(viewerDoc as DeviceState));
      });
    }
  }, []);

  useEffect(() => {
    if (!localStream || !localStream?.active) {
      getMedia().then(localMedia => {
        dispatch(ConnectionActionCreator.setLocalStream(localMedia));
      });
    }
  }, []);

  useEffect(() => {
    if (user && localDevice && localStream) {
      const key = `users/${user?.uid}/cameras`;
      const camerasQuery = query(collection(db, key));
      const unsubscribeCamerasCollection = onSnapshot(camerasQuery, async snapshot => {
        snapshot.docChanges().map(async (change) => {
          if (change.type === "added") {
            const cameraDoc = change.doc as DeviceState;
            const cameraKey = `users/${user.uid}/cameras/${cameraDoc.id}`
            
            const connection = await setViewerConnection(cameraDoc, user.uid, dispatch, localDevice, localStream);

            const [unsubscribeDescriptions, unsubscribeICECandidates] = getViewerSubscriptions(
              cameraKey, 
              localDevice, 
              connection
              );

            setSubscriptions((prev) => ({
              ...prev,
              [cameraDoc.id]: {
                unsubDescriptions: unsubscribeDescriptions,
                unsubICECandidates: unsubscribeICECandidates
              }
            }));
            
          } else if (change.type === "removed") {
            console.log(subscriptions);
            clearConnectionById(change.doc.id, subscriptions, setSubscriptions, dispatch);
          }
        });
      }, (error) => console.log(error));  

      return (() => {
        
        for (const id in remoteDevices) {
          removeItems(`users/${user.uid}/cameras/${id}/viewers/${localDevice.id}/offeringCandidates`);
          removeItems(`users/${user.uid}/cameras/${id}/viewers/${localDevice.id}/answeringCandidates`);
          removeItem(`users/${user.uid}/cameras/${id}/viewers/${localDevice.id}`);
        }
        removeItem(`users/${user.uid}/viewers/${localDevice.id}`);
        
        unsubscribeCamerasCollection();
        for (const id in connections) {
          clearConnectionById(id, subscriptions, setSubscriptions, dispatch)
        }
        
        dispatch(ConnectionActionCreator.setLocalStream(null));
        dispatch(ConnectionActionCreator.setLocalDevice(null));
      });
    }
  }, [localDevice, localStream]);

  return (<div className="viewer body-content">
    <h1>Viewer</h1>
    {user?.email}
    <div className="list-cameras-wrapper">
      list of camera
      <ul>
        {Object.entries(remoteDevices).map(([id, camera]) => {
          return (<li key={id}>
            <CameraItem camera={camera} />
          </li>);
        })}
      </ul>
    </div>
  </div>);
}