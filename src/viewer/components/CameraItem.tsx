import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Stream } from "../../common/components/Stream";
import { CameraState, StreamActionCreator, useStreamContext, useStreamDispatchContext } from "../../common/contexts/StreamContext";
import { addItem, removeItem, removeItems, updateItem } from "../../common/functions/storage";
import { collection, doc, onSnapshot, query, } from "firebase/firestore";
import openRelayTurnServer from "../../turnSettings";
import { db } from "../../common/functions/firebaseInit";
import { useAuthContext } from "../../common/contexts/AuthContext";

interface CameraItemProps {
  camera: CameraState
}

export function CameraItem({camera}: CameraItemProps) {
  const {remoteStreams, localStream, viewer} = useStreamContext();
  const {user} = useAuthContext();
  const navigate = useNavigate();
  const dispatch = useStreamDispatchContext();

  function onClick () {
    navigate(`/viewer/${viewer?.id}/camera/${camera.id}`); // TODO: make route
  }

  const connection = useMemo(() => {
    const connection = new RTCPeerConnection(openRelayTurnServer);
    return connection;
  }, [viewer]);

  useEffect(() => {
    const key = `users/${user?.uid}/cameras/${camera?.id}`;
    async function setViewerConnection() {
      if (localStream && localStream?.active && viewer && connection) {
        localStream.getTracks().forEach(track => connection.addTrack(track, localStream));
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer).catch(error => console.log(error));
    
        const viewerWithOffer = {
          offer: {
            type: offer.type,
            sdp: offer.sdp
          }
        };
      
        updateItem(key + "/viewers/" + viewer?.id, viewerWithOffer)
      }
    }

    setViewerConnection();

    connection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }
      const key = `users/${user?.uid}/cameras/${camera.id}/viewers/${viewer?.id}/offeringCandidates`; 
      addItem(key, event.candidate.toJSON());
    };
  
    connection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      dispatch(StreamActionCreator.addRemoteStream(camera.id, remoteStream));
    };

    const viewerKey = key + "/viewers/" + viewer?.id;
    const unsubscribeViewerDoc = onSnapshot(doc(db, viewerKey), async (snapshot) => {
      const data = snapshot.data();
      if (!connection?.currentRemoteDescription && data?.answer) {
        const answer = new RTCSessionDescription(data.answer);
        await connection?.setRemoteDescription(answer);
        }
    }, (error) => console.log(error));

    const q = query(
      collection(db, viewerKey, "answeringCandidates")
    );
    const unsubscribeAnsweringCandidatesCollection = onSnapshot(q, async (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          connection?.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    }, (error) => console.log(error));

    
    console.log("connection status", connection?.connectionState);
    return () => {
      unsubscribeViewerDoc();
      unsubscribeAnsweringCandidatesCollection();

      const key = `users/${user?.uid}/cameras/${camera?.id}/viewers/${viewer?.id}`;
      removeItems(key + "/answeringCandidates");
      removeItems(key + "/offeringCandidates");
      removeItem(key);
      
      for (const id in remoteStreams) {
        dispatch(StreamActionCreator.removeRemoteStream(id));
      }
      dispatch(StreamActionCreator.clearRemoteCameras());

      connection.close();
    }
  }, [viewer]);


  return (<div className="camera-item" onClick={onClick}>
    <h1>{camera.data()?.cameraName}</h1>
    <Stream stream={remoteStreams?.[camera?.id]} />
  </div>);
}