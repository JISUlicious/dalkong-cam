import "../../common/styles/Viewer.scss";

import React, { useEffect } from "react";
import { Unsubscribe, collection, doc, getDoc, onSnapshot, query } from "firebase/firestore";

import { CameraItem } from "./CameraItem";

import { useAuthContext } from "../../common/contexts/AuthContext";
import { 
  ConnectionActionCreator,
  DeviceState,
  useConnectionContext, 
  useConnectionDispatchContext
} from "../../common/contexts/ConnectionContext";

import { addItem, removeItem, removeItems, updateItem} from "../../common/functions/storage";
import { getMedia } from "../../common/functions/getMedia";
import { db } from "../../common/functions/firebaseInit";
import openRelayTurnServer from "../../turnSettings";

export interface Subscriptions {
  [id: string]: {
    unsubDescriptions: Unsubscribe,
    unsubICECandidates: Unsubscribe
  }
}



function ConnectionController (
  {remoteDevice}: {remoteDevice: DeviceState}
) {
  const {user} = useAuthContext();
  const {localStream, localDevice} = useConnectionContext();
  const dispatch = useConnectionDispatchContext();

  useEffect(() => {
    const connection = new RTCPeerConnection(openRelayTurnServer);
    const cameraKey = `users/${user!.uid}/cameras/${remoteDevice.id}`;
    const viewerKey = `${cameraKey}/viewers/${localDevice!.id}`;

    connection.onicecandidate = (event) => {
      if (!event.candidate) {
      return;
      }
      const key = `${cameraKey}/viewers/${localDevice!.id}/offeringCandidates`; 
      addItem(key, event.candidate.toJSON());
    };
    
    connection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      dispatch(ConnectionActionCreator.addRemoteStream(remoteDevice.id, remoteStream));
    };
    
    dispatch(ConnectionActionCreator.addConnection(remoteDevice.id, connection));
  
    localStream!.getTracks().forEach(track => connection.addTrack(track, localStream!));
    connection.createOffer().then(async offer => {
      await connection.setLocalDescription(offer).catch(error => console.log(error));
    
      const viewerWithOffer = {
        offer: {
          type: offer.type,
          sdp: offer.sdp
        }
      };
      
      updateItem(viewerKey, viewerWithOffer);
    });

    const unsubscribeDescriptions = onSnapshot(doc(db, viewerKey), async (snapshot) => {
      const data = snapshot.data();
      if (!connection?.currentRemoteDescription && data?.answer) {
        const answer = new RTCSessionDescription(data.answer);
        await connection?.setRemoteDescription(answer);
        }
    }, (error) => console.log(error));

    const q = query(
      collection(db, viewerKey, "answeringCandidates")
    );
    const unsubscribeICECandidates = onSnapshot(q, async (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          connection?.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    }, (error) => console.log(error));

    return () => {
      unsubscribeDescriptions();
      unsubscribeICECandidates();
      
      removeItems(`${viewerKey}/offeringCandidates`);
      removeItems(`${viewerKey}/answeringCandidates`);
      removeItem(viewerKey);
      
      connection.close();
      
      dispatch(ConnectionActionCreator.removeRemoteStream(remoteDevice.id));
    }
  }, [remoteDevice]);

  return null;
}

export function Viewer () {

  const {user} = useAuthContext();
  
  const {localStream, localDevice, remoteDevices} = useConnectionContext();

  const dispatch = useConnectionDispatchContext();

  useEffect(() => {
    const key = `users/${user?.uid}/viewers`;
    addItem(key, {}).then(async docRef => {
      const viewerDoc = await getDoc(docRef);
      dispatch(ConnectionActionCreator.setLocalDevice(viewerDoc as DeviceState));
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
      const key = `users/${user?.uid}/cameras`;
      const camerasQuery = query(collection(db, key));
      const unsubscribeCamerasCollection = onSnapshot(camerasQuery, async snapshot => {
        snapshot.docChanges().map((change) => {
          if (change.type === "added") {
            dispatch(ConnectionActionCreator.addRemoteDevice(change.doc as DeviceState));
          } else if (change.type === "removed") {
            dispatch(ConnectionActionCreator.removeRemoteDevice(change.doc.id));
          }
        });
      }, (error) => console.log(error));  

      return (() => {
        unsubscribeCamerasCollection();
        
        localStream.getTracks().forEach(track => track.stop());
        dispatch(ConnectionActionCreator.setLocalStream(null));

        removeItem(`users/${user!.uid}/viewers/${localDevice!.id}`);
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
    {
      Object.entries(remoteDevices).map(([id, camera]) => {
        return (<ConnectionController remoteDevice={camera} key={id} />);
      })
    }
  </div>);
}