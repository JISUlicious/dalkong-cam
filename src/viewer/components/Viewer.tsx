import "../../common/styles/Viewer.scss";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CameraItem } from "./CameraItem";
import { addItem, getItem, updateItem } from "../../common/functions/storage";
import { useAuthContext } from "../../common/contexts/AuthContext";
import { CameraDoc, CameraState, StreamActionCreator, useStreamContext, useStreamDispatchContext } from "../../common/contexts/StreamContext";
import openRelayTurnServer from "../../turnSettings";
import { getMedia } from "../../common/functions/getMedia";
import { onSnapshot, query, doc, collection } from "firebase/firestore";
import { db } from "../../common/functions/firebaseInit";

export function Viewer () {
  const {viewerId} = useParams();
  const {user} = useAuthContext();
  const {remoteCameras} = useStreamContext();

  const dispatch = useStreamDispatchContext();
  
  // TODO: 
  // add eventlisteners for icecandidates, tracks
  // add onSnapshot for answeringCandidates
  // add onSnapshot for camera doc change
  useEffect(() => {
    const key = `users/${viewerId}/cameras`;
    getItem(key).then(snapshot => {
      snapshot.docs.forEach((document) => {
        dispatch(StreamActionCreator.addRemoteCamera(document as CameraState));
      });
    });

    getMedia().then(viewerMedia => dispatch(StreamActionCreator.setLocalStream(viewerMedia)));

    return () => {
      dispatch(StreamActionCreator.setLocalStream(null));
    }
  }, []);


  const cameraItems: ReactNode[] = [];
  if (remoteCameras) {
    for (const [id, camera] of Object.entries(remoteCameras)) {
      const cameraItem = (<li key={camera.id}>
        <CameraItem 
          viewerId={viewerId!}
          camera={camera}
        />
      </li>)
      cameraItems.push(cameraItem);
    }
  }


  return <div className="viewer body-content">
    <h1>Viewer</h1>
    {user?.email}
    <div className="list-cameras-wrapper">
      list of camera
      <ul>
        {cameraItems}
      </ul>
    </div>
  </div>;
}