import "../../common/styles/Camera.scss";

import React, { useEffect } from "react";
import { collection, doc, getDoc, onSnapshot, query } from "firebase/firestore";

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
import { addItem, removeItem, updateItem } from "../../common/functions/storage";
import { getMedia } from "../../common/functions/getMedia";
import openRelayTurnServer from "../../turnSettings";

function CameraConnectionController ({remoteDevice}: {remoteDevice: DeviceState}) {
  const {user} = useAuthContext();
  const {localDevice, localStream} = useConnectionContext();
  const dispatch = useConnectionDispatchContext();

  useEffect(() => {
    const connection = new RTCPeerConnection(openRelayTurnServer);
    const viewerKey = `users/${user!.uid}/cameras/${localDevice!.id}/viewers/${remoteDevice.id}`;
    
    connection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }
      const key = `${viewerKey}/answeringCandidates`; 
      addItem(key, event.candidate.toJSON());
    };

    connection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      dispatch(ConnectionActionCreator.addRemoteStream(remoteDevice.id, remoteStream));
    };

    const unsubscribeDescriptions = onSnapshot(doc(db, viewerKey), async (snapshot) => {
      const data = snapshot.data();
      if (!connection.currentRemoteDescription && data?.offer) {
        const offer = data.offer; 
        await connection.setRemoteDescription(offer);
        localStream?.getTracks().forEach(track => connection.addTrack(track, localStream));
        
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        const viewerWithAnswer = {
          answer: {
            type: answer.type,
            sdp: answer.sdp
          }
        };
        updateItem(viewerKey, viewerWithAnswer);
      }
    }, (error) => console.log(error));
    
    const q = query(
      collection(db, viewerKey, "offeringCandidates")
    );
    const unsubscribeICECandidates = onSnapshot(q, async (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          connection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    }, (error) => console.log(error));

    return () => {
      unsubscribeDescriptions();
      unsubscribeICECandidates();
      
      dispatch(ConnectionActionCreator.removeRemoteStream(remoteDevice.id));

      connection.close();
    };
  }, [remoteDevice]);
  return null;
}

export function Camera () {
  const {user} = useAuthContext();
  const {localDevice, localStream, remoteDevices} = useConnectionContext();
  const dispatch = useConnectionDispatchContext();
  
  const savedTimes = ["2023-02-01 12:00:00", "2023-02-01 12:05:00", "2023-02-01 12:10:00", "a", "ddd", "aaa", "g"];

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
            dispatch(ConnectionActionCreator.addRemoteDevice(change.doc as DeviceState));
          } else if (change.type === "removed") {
            dispatch(ConnectionActionCreator.removeRemoteDevice(change.doc.id));
          }
        });
      }, (error) => console.log(error));
      return () => {
        unsubscribeViewersCollection();
        const cameraKey = `users/${user?.uid}/cameras/${localDevice.id}`;

        removeItem(cameraKey);

        localStream.getTracks().forEach(track => track.stop());
        dispatch(ConnectionActionCreator.setLocalStream(null));
        dispatch(ConnectionActionCreator.setLocalDevice(null));
      };
    }
  }, [user, localDevice, localStream]);

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
    {
      Object.entries(remoteDevices).map(([id, camera]) => {
        return (<CameraConnectionController remoteDevice={camera} key={id} />);
      })
    }
  </div>);
}