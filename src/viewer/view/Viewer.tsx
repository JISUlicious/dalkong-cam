import React, { useEffect, useRef, useState } from "react";
import { collection, doc, getDoc, onSnapshot, query } from "firebase/firestore";

import { CameraItem } from "../components/CameraItem";

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



export function Viewer() {

  const { user } = useAuthContext();

  const { localStream, localDevice, remoteDevices } = useConnectionContext();

  const [rowColValue, setRowColValue] = useState<number>(3);

  useEffect(() => {
    function setRowColFromWidth() {
      const width = window.innerWidth;
      if (width >= 1400) {
        setRowColValue(3);
      } else if (width >= 768) {
        setRowColValue(2);
      } else {
        setRowColValue(1);
      }
    }
    setRowColFromWidth();
    window.addEventListener("resize", setRowColFromWidth)
  }, []);

  const sessions = useRef<Record<string, number | undefined>>();
  const recordingStates = useRef<Record<string, boolean | undefined>>();

  useEffect(() => {
    const sessionIds: Record<string, number | undefined> = {};
    Object.entries(remoteDevices).map(([id, device]) => {
      sessionIds[id] = device.data()?.sessionId;
    });
    sessions.current = sessionIds;

    const isRecordings: Record<string, boolean | undefined> = {};
    Object.entries(remoteDevices).map(([id, device]) => {
      isRecordings[id] = device.data()?.isRecording;
    });
    recordingStates.current = isRecordings;
  }, [remoteDevices]);

  const dispatch = useConnectionDispatchContext();

  const { viewerId } = useParams();
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
          console.log(change.type)
          if (change.type === "added") {
            dispatch(ConnectionActionCreator.addRemoteDevice(change.doc as DeviceState));
          } else if (change.type === "removed") {
            dispatch(ConnectionActionCreator.removeRemoteDevice(change.doc.id));
          } else if (change.type === "modified") {
            const docId = change.doc.id;
            if (sessions.current?.[docId] !== change.doc.data().sessionId) {
              dispatch(ConnectionActionCreator.addRemoteDevice(change.doc as DeviceState));
            } else if (recordingStates.current?.[docId] !== change.doc.data().isRecording) {
              dispatch(ConnectionActionCreator.updateRemoteDevice(change.doc as DeviceState));
            }
          }
        });
      }, (error) => console.log(error));

      return (() => unsubscribeCamerasCollection());
    }
  }, [user, localDevice, !!localStream]);

  console.log(remoteDevices)

  return (<div className="viewer body-content container-fluid w-100 pt-3 p-1 mx-0">
    <h6 className="text-center">
      {Object.keys(remoteDevices).length} Camera{Object.keys(remoteDevices).length < 2 ? "" : "s"} Online
    </h6>
    <div className={`list-cameras-wrapper row mx-0 p-1 row-cols-${rowColValue}`}>
      {Object.entries(remoteDevices).map(([id, camera]) => {
        return (<div key={id} className="col py-2">
          <CameraItem camera={camera} />
        </div>);
      })}
    </div>
  </div>);
}