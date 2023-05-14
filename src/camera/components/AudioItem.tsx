import React, { useEffect, useMemo } from "react";
import { AudioStream } from "./AudioStream";
import { CameraState, StreamActionCreator, useStreamContext, useStreamDispatchContext } from "../../common/contexts/StreamContext";
import { useAuthContext } from "../../common/contexts/AuthContext";
import { addItem, updateItem } from "../../common/functions/storage";
import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { db } from "../../common/functions/firebaseInit";
import openRelayTurnServer from "../../turnSettings";

interface RemoteViewer {
  viewer: CameraState
}

export function AudioItem ({viewer}: RemoteViewer) {
  const {user} = useAuthContext();
  const {camera, localStream, remoteStreams} = useStreamContext();
  const dispatch = useStreamDispatchContext();
  
  const connection = useMemo(() => {
    const connection = new RTCPeerConnection(openRelayTurnServer);
    return connection;
  }, [viewer]);

  useEffect(() => {
    const key = `users/${user?.uid}/cameras/${camera?.id}/viewers/${viewer.id}`;
    
    connection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }
      const key = `users/${user?.uid}/cameras/${camera?.id}/viewers/${viewer.id}/answeringCandidates`; 
      addItem(key, event.candidate.toJSON());
    };
  
    connection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      dispatch(StreamActionCreator.addRemoteStream(viewer.id, remoteStream));
    };

    const unsubscribeDoc = onSnapshot(doc(db, key), async (snapshot) => {
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
        updateItem(key, viewerWithAnswer);
      }
    }, (error) => console.log(error));
    
    const q = query(
      collection(db, key, "offeringCandidates")
    );
    const unsubscribeCandidatesCollection = onSnapshot(q, async (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          connection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    }, (error) => console.log(error));
    
    return () => {
      unsubscribeDoc();
      unsubscribeCandidatesCollection();

      for (const id in remoteStreams) {
        dispatch(StreamActionCreator.removeRemoteStream(id));
      }
      dispatch(StreamActionCreator.clearRemoteCameras());

      connection.close();
    }
  }, [viewer.id]);
  return <AudioStream stream={remoteStreams?.[viewer.id]} />
}