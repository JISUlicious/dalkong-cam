import "../../common/styles/Viewer.scss";

import React, { useEffect } from "react";
import { collection, getDoc, onSnapshot, query } from "firebase/firestore";

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


export function Viewer () {

  const {user} = useAuthContext();
  
  const {localStream, localDevice, remoteDevices} = useConnectionContext();

  const dispatch = useConnectionDispatchContext();

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
  }, []);

  useEffect(() => {
    if (user && localDevice && localStream) {
      const key = `users/${user?.uid}/cameras`;
      const camerasQuery = query(collection(db, key));
      const unsubscribeCamerasCollection = onSnapshot(camerasQuery, async snapshot => {
        snapshot.docChanges().map(async (change) => {
          if (change.type === "added") {
            dispatch(ConnectionActionCreator.addRemoteDevice(change.doc as DeviceState));
          } else if (change.type === "removed") {
            dispatch(ConnectionActionCreator.removeRemoteDevice(change.doc.id));
          }
        });
      }, (error) => console.log(error));  

      return (() => {
        unsubscribeCamerasCollection();
        
        dispatch(ConnectionActionCreator.setLocalStream(null));
        dispatch(ConnectionActionCreator.setLocalDevice(null));
      });
    }
  }, [user, localDevice, localStream]);

  return (<div className="viewer body-content">
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