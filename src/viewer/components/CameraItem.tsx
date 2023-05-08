import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Stream } from "../../common/components/Stream";
import { CameraState, StreamActionCreator, useStreamContext, useStreamDispatchContext } from "../../common/contexts/StreamContext";
import { addItem, updateItem } from "../../common/functions/storage";
import { collection, doc, onSnapshot, query, } from "firebase/firestore";
import openRelayTurnServer from "../../turnSettings";
import { db } from "../../common/functions/firebaseInit";

interface CameraItemProps {
  viewerId: string,
  camera: CameraState
}

export function CameraItem({viewerId, camera}: CameraItemProps) {
  const {remoteStreams, localStream} = useStreamContext();
  const navigate = useNavigate();
  const dispatch = useStreamDispatchContext();

  function onClick () {
    navigate(`/viewer/${viewerId}/camera/${camera!.id}`); // TODO: make route
  }

  const connection = useMemo(() => {
    const connection = new RTCPeerConnection(openRelayTurnServer)
    connection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }
      const key = `users/${viewerId}/cameras/${camera?.id}/offeringCandidates`; 
      addItem(key, event.candidate.toJSON());
    };
  
    connection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      dispatch(StreamActionCreator.addRemoteStream(camera.id, remoteStream));
    };
    
    return connection;
  }, []);
  
  useEffect(() => {
    const key = `users/${viewerId}/cameras/${camera?.id}`;
    async function setViewerConnection() {
      const data = camera?.data();
      if (data?.offer && localStream) {
        const offer = data.offer;
        
        await connection.setRemoteDescription(offer);
        localStream.getTracks().forEach(track => connection.addTrack(track, localStream));
        dispatch(StreamActionCreator.setLocalStream(localStream));

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
    }

    setViewerConnection();

    const unsubscribeCameraDoc = onSnapshot(doc(db, key), async (snapshot) => {
      const data = snapshot.data();
      if (!connection.currentRemoteDescription && data?.answer) {
        const answer = new RTCSessionDescription(data.answer);
        await connection.setRemoteDescription(answer);
        console.log("answer received");
        }
    }, (error) => console.log(error));

    const q = query(
      collection(db, key, "offeringCandidates")
    );
    const unsubscribeOfferingCandidatesCollection = onSnapshot(q, async (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          connection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    }, (error) => console.log(error));

    
    console.log("connection status", connection.connectionState);
    return () => {
      unsubscribeCameraDoc();
      unsubscribeOfferingCandidatesCollection();
      remoteStreams?.[camera!.id]?.getTracks().forEach(track => track.stop());
      connection.close();
    }
  }, []);


  return (<div className="camera-item" onClick={onClick}>
    <h1>{camera.data()?.cameraName}</h1>
    <Stream stream={remoteStreams?.[camera!.id]} />
  </div>);
}