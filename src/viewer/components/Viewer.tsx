import "../../common/styles/Viewer.scss";

import React, { useEffect } from "react";
import { collection, doc, getDoc, onSnapshot, query } from "firebase/firestore";

import { CameraItem } from "./CameraItem";

import { useAuthContext } from "../../common/contexts/AuthContext";
import { 
  ConnectionActionCreator,
  DeviceState,
  useConnectionContext, 
  useConnectionDispatchContext
} from "../../common/contexts/ConnectionContext";

import { getMedia } from "../../common/functions/getMedia";
import { db } from "../../common/functions/firebaseInit";
import { useParams } from "react-router-dom";
import { getItem, removeItem, removeItems } from "../../common/functions/storage";


export function Viewer () {

  const {user} = useAuthContext();
  
  const {localStream, localDevice, remoteDevices, connections} = useConnectionContext();

  const dispatch = useConnectionDispatchContext();

  const {viewerId} = useParams();
  useEffect(() => {
    if (!localDevice && user) {
      getItem(`users/${user.uid}/cameras`)
        .then(snapshot => {
          snapshot.forEach(doc => {
            removeItems(`${doc.ref.path}/connections/${viewerId}/offeringCandidates`);
            removeItems(`${doc.ref.path}/connections/${viewerId}/answeringCandidates`);
            removeItem(`${doc.ref.path}/connections/${viewerId}`);
          });
        });

      getDoc(doc(db, `users/${user.uid}/viewers/${viewerId}`))
        .then(doc => dispatch(ConnectionActionCreator.setLocalDevice(doc as DeviceState)));
    }
  }, [user, localDevice]);

  useEffect(() => {
    if (!localStream?.active) {
      getMedia().then(localMedia => {
        localMedia.getTracks().forEach(track => {
          if (track.kind === "audio") {
            track.enabled = false;
          }
        });
        dispatch(ConnectionActionCreator.setLocalStream(localMedia));
      });
    }
    return (() => {
      dispatch(ConnectionActionCreator.setLocalStream(null));
      dispatch(ConnectionActionCreator.setLocalDevice(null));
    });
  }, []);

  useEffect(() => {
    if (user && localDevice && localStream) {
      const key = `users/${user?.uid}/cameras`;
      const camerasQuery = query(collection(db, key));
      const unsubscribeCamerasCollection = onSnapshot(camerasQuery, async snapshot => {
        snapshot.docChanges().map(async (change) => {
          if (["added", "modified"].includes(change.type)) {
            dispatch(ConnectionActionCreator.addRemoteDevice(change.doc as DeviceState));
          } else if (change.type === "removed") {
            dispatch(ConnectionActionCreator.removeRemoteDevice(change.doc.id));
          } 
        });
      }, (error) => console.log(error));  
      
      return (() => unsubscribeCamerasCollection());
    }
  }, [user, localDevice, !!localStream]);

  return (<div className="viewer body-content">
    <button onClick={() => console.log(connections)}>b</button>
    <h1>Viewer</h1>
    {localDevice?.data()?.deviceName}
    <div className="list-cameras-wrapper">
      list of cameras
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