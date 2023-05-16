import "../../common/styles/Viewer.scss";

import React, { useEffect, useMemo, useState } from "react";
import { Unsubscribe, collection, doc, getDoc, onSnapshot, query } from "firebase/firestore";

import { CameraItem } from "./CameraItem";

import { useAuthContext } from "../../common/contexts/AuthContext";
import { 
  ConnectionActionCreator,
  DeviceState,
  useConnectionContext, 
  useConnectionDispatchContext
} from "../../common/contexts/ConnectionContext";

import { addItem, getItem, removeItem, updateItem} from "../../common/functions/storage";
import { getMedia } from "../../common/functions/getMedia";
import openRelayTurnServer from "../../turnSettings";
import { db } from "../../common/functions/firebaseInit";
import { unsubscribe } from "diagnostics_channel";
import { useViewerConnection } from "../hooks/useViewerConnection";
import { useViewerSubscriptions } from "../hooks/useViewerSubscriptions";

interface Subscriptions {
  [id: string]: {
    unsubDescriptions: Unsubscribe,
    unsubICECandidates: Unsubscribe
  }
}

export function Viewer () {

  // get local stream
  // listen for doc change
  //  -> new doc => answer to the connection, 
  //                listen for viewer doc change, 
  //                ice event, 
  //                track event, 
  //                store connection in context
  // unsubscribe
  // remove doc
  // close connection

  const {user} = useAuthContext();
  
  const {localStream, localDevice, remoteDevices, remoteStreams} = useConnectionContext();

  const dispatch = useConnectionDispatchContext();

  const [subscriptions, setSubscriptions] = useState<Subscriptions>({});

  useEffect(() => {
    console.log("setting local device");
    if (localDevice) {
      return ;
    }
    const key = `users/${user?.uid}/viewers`;
    addItem(key, {}).then(async docRef => {
      const viewerDoc = await getDoc(docRef);
      dispatch(ConnectionActionCreator.setLocalDevice(viewerDoc as DeviceState));
    });
  }, []);

  useEffect(() => {
    if (!localStream || !localStream?.active) {
      getMedia().then(localMedia => {
        dispatch(ConnectionActionCreator.setLocalStream(localMedia));
      });
      return dispatch(ConnectionActionCreator.setLocalStream(null));
    }
  }, []);

  useEffect(() => {
    if (user && localDevice) {
      const key = `users/${user?.uid}/cameras`;
      const camerasQuery = query(collection(db, key));
      const unsubscribeCamerasCollection = onSnapshot(camerasQuery, async snapshot => {
        snapshot.docChanges().map(async (change) => {
          if (change.type === "added") {
            console.log("camera found");
            const cameraDoc = change.doc;
            const cameraKey = `users/${user.uid}/cameras/${cameraDoc.id}`

            dispatch(ConnectionActionCreator.addRemoteDevice(cameraDoc as DeviceState));
  
            const connection = useViewerConnection(user.uid, cameraDoc.id, localDevice.id, dispatch);
            
            localStream?.getTracks().forEach(track => connection.addTrack(track, localStream));
            const offer = await connection.createOffer();
            await connection.setLocalDescription(offer).catch(error => console.log(error));
        
            const viewerWithOffer = {
              offer: {
                type: offer.type,
                sdp: offer.sdp
              }
            };
          
            updateItem(cameraKey + "/viewers/" + localDevice.id, viewerWithOffer)

            const [unsubscribeDescriptions, unsubscribeICECandidates] = useViewerSubscriptions(cameraKey, localDevice, connection);
            setSubscriptions((prev) => ({
              ...prev,
              [cameraDoc.id]: {
                unsubDescriptions: unsubscribeDescriptions,
                unsubICECandidates: unsubscribeICECandidates
              }
            }));
          }
        });
      }, (error) => console.log(error));  
      return (() => {
        unsubscribeCamerasCollection();
        Object.entries(subscriptions).map(([id, subscriptions]) => {
          subscriptions.unsubDescriptions();
          subscriptions.unsubICECandidates();
        });

        for (const id in remoteDevices) {
          removeItem(`users/${user.uid}/cameras/${id}/viewers/${localDevice.id}`);
        }
        removeItem(`users/${user.uid}/viewers/${localDevice.id}`);

        dispatch(ConnectionActionCreator.setLocalStream(null));
        dispatch(ConnectionActionCreator.clearRemoteDevices());

        for (const id in remoteStreams) {
          dispatch(ConnectionActionCreator.removeRemoteStream(id));
        }
      });
    }
  }, [localDevice]);

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