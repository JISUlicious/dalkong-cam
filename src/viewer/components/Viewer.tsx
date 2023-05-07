import "../../common/styles/Viewer.scss";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CameraItem } from "./CameraItem";
import { addItem, getItem, updateItem } from "../../common/functions/storage";
import { useAuthContext } from "../../common/contexts/AuthContext";
import { StreamActionCreator, useStreamContext, useStreamDispatchContext } from "../../common/contexts/StreamContext";

export function Viewer () {
  const {viewerId} = useParams();
  const {user} = useAuthContext();
  const {remoteCameras, remoteStreams} = useStreamContext();

  const dispatch = useStreamDispatchContext();
  useEffect(() => {
    const key = `users/${viewerId}/cameras`;
    getItem(key).then(res => {
      res.docs.forEach(doc => {
        const data = doc.data();
        const connection = new RTCPeerConnection;
        connection.setRemoteDescription(data.offer);
        connection.createAnswer().then(answer => {
          connection.setLocalDescription(answer);
          const viewerWithAnswer = {
            answer: {
              type: answer.type,
              sdp: answer.sdp,
            }
          };
          const key = `users/${viewerId}/cameras/${doc.id}`;
          updateItem(key, viewerWithAnswer).then(docRef => console.log(docRef));

          connection.addEventListener('icecandidate', event => {
            if (!event.candidate) {
              return;
            }
            const key = `users/${viewerId}/cameras/${doc.id}/answeringCandidates`;
            addItem(key, event.candidate.toJSON());
          });

          connection.addEventListener('track', async (event: RTCTrackEvent) => {
            console.log("streams", event.streams);
            // TODO: add stream to context
            const [remoteStream] = event.streams;
            dispatch(StreamActionCreator.addRemoteStream(doc.id, remoteStream));
          });
        
        })
        console.log("doc", doc);
        dispatch(StreamActionCreator.addRemoteCamera(doc));
      })
    });
  }, [])
  

  return <div className="viewer body-content">
    <h1>Viewer</h1>
    {user?.email}
    <div className="list-cameras-wrapper">
      list of camera
      <ul>
        {remoteCameras?.map((cameraData, i) => {
          if (cameraData !== undefined) {
            return (<li key={cameraData.id}>
              <CameraItem 
                title={cameraData.data()?.cameraName}
                viewerId={viewerId!}
                cameraId={cameraData.id}
                stream={remoteStreams?.[cameraData.id]}
              />
            </li>);
          }
        })}
      </ul>
    </div>
  </div>;
}