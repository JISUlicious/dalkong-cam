import "../../common/styles/Camera.scss";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { DocumentData, DocumentReference, collection, doc, getDoc, onSnapshot, query } from "firebase/firestore";

import { VideoItem } from "../../viewer/components/VideoItem";
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
import { useParams } from "react-router-dom";
import { addItem, getItem, removeItem, removeItems, storeFile, updateItem } from "../../common/functions/storage";
import { StreamWithControls } from "../../common/components/StreamWithControls";
import { useRecording } from "../hooks/useRecording";

export function Camera () {
  const {user} = useAuthContext();
  const {localDevice, localStream, remoteDevices, connections} = useConnectionContext();
  const dispatch = useConnectionDispatchContext();
  
  const {cameraId} = useParams();

  const videoRef = useRef<HTMLVideoElement>(null);

  const recorder = useMemo(() => {
    if (localStream) {
      const recorder = new MediaRecorder(localStream);
      return recorder;
    } 
    }, [localStream]);
  
  const savedTimes = ["2023-02-01 12:00:00", "2023-02-01 12:05:00", "2023-02-01 12:10:00", "a", "ddd", "aaa", "g"];
  
  const onRecorderStop = useCallback((blob: Blob[]) => {
    if (user && localDevice) {
      const savedVideoId = Date.now();
      const key = `savedVideos/${user.uid}/${localDevice.id}/${savedVideoId}`;
      const recordedBlob = new Blob(blob, { type: "video/webm" });
      return storeFile(key, recordedBlob).then(
        (result): Promise<DocumentReference<object>> | Promise<DocumentReference<DocumentData>> => {
        const key = `users/${user.uid}/savedVideos`;
        return addItem(
          key, 
          {
            path: result.ref.parent?.fullPath, 
            deviceName: localDevice.data()?.deviceName,
            timestamp: savedVideoId
          }
          );
      });
    }
  }, [user, localDevice])

  const [isRecording, setIsRecording] = useRecording(videoRef, recorder, onRecorderStop);

  useEffect(() => {
    if (user && localDevice) {
      getDoc(doc(db, `users/${user.uid}/cameras/${localDevice.id}`))
        .then(doc => {
          const updatedDoc = doc.data()!;
          updatedDoc.isRecording = isRecording;
          return updateItem(`users/${user.uid}/cameras/${localDevice.id}`, updatedDoc);
        })
        .then(() => getDoc(doc(db, `users/${user.uid}/cameras/${cameraId}`)))
        .then(doc => dispatch(ConnectionActionCreator.setLocalDevice(doc as DeviceState)));
    }
  }, [user, !!localDevice, isRecording]);
  
  useEffect(() => {
    if (localStream) {
      if (!videoRef.current || !localStream)
        return;
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (!localDevice && user) {
      getItem(`users/${user.uid}/cameras/${cameraId}/connections`)
        .then(snapshot => {
          snapshot.forEach(doc => {
            removeItems(`${doc.ref.path}/offeringCandidates`);
            removeItems(`${doc.ref.path}/answeringCandidates`);
            removeItem(doc.ref.path);
          });
        });

      getDoc(doc(db, `users/${user.uid}/cameras/${cameraId}`))
        .then(doc => {
          const updatedDoc = doc.data()!;
          updatedDoc.sessionId = Date.now();
          updateItem(`users/${user.uid}/cameras/${cameraId}`, updatedDoc);
          dispatch(ConnectionActionCreator.setLocalDevice(doc as DeviceState));
        });
    }
  }, [user, localDevice]);

  useEffect(() => {
    if (!localStream?.active) {
      getMedia().then(localMedia => {
        dispatch(ConnectionActionCreator.setLocalStream(localMedia));
      });
    }
    return (() => {
      dispatch(ConnectionActionCreator.setLocalDevice(null));
      dispatch(ConnectionActionCreator.setLocalStream(null));
    });
  }, []);
  
  useEffect(() => {
    if (user && localDevice && localStream) {
      if (Object.keys(connections).length === 0) {
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
        return (() => unsubscribeViewersCollection());
      }
    }
  }, [user, localDevice, !!localStream]);

  return (<div className="camera body-content">
    <StreamWithControls ref={videoRef} device={localDevice} muted={true}/>
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
