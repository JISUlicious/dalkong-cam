import "../../common/styles/Camera.scss";
import { useParams } from "react-router-dom";
import { VideoItem } from "../../viewer/components/VideoItem";
import { Stream } from "../../common/components/Stream";
import React, { useEffect, useMemo, useState } from "react";
import { getMedia } from "../../common/functions/getMedia";
import {
  StreamActionCreator,
  useStreamContext,
  useStreamDispatchContext
} from "../../common/contexts/StreamContext";
import openRelayTurnServer from "../../turnSettings";
import { useAuthContext } from "../../common/contexts/AuthContext";
import { addItem, updateItem } from "../../common/functions/storage";
import { VideoOverlay } from "../../common/components/VideoOverlay";
import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { db } from "../../common/functions/firebaseInit";
import { getEventListeners } from "events";
import { useLocalStream } from "../../common/hooks/useLocalStream";

export function Camera () {
  const {user} = useAuthContext();
  const {cameraId} = useParams();
  const {camera, localStream} = useStreamContext();
  const dispatch = useStreamDispatchContext();
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[] | null>(null);
  const savedTimes = ["2023-02-01 12:00:00", "2023-02-01 12:05:00", "2023-02-01 12:10:00", "a", "ddd", "aaa"];

  // get media
  // connection
  // create offer
  // set local description
  // set offer on firestore
  // add local tracks
  // set local stream
  // onSnapshot for camera doc change

  // TODO: 
  // add eventlisteners for icecandidates, tracks
  // add onSnapshot for answeringCandidates


  const connection = useMemo(() => {
    console.log("creating connection");
    const connection = new RTCPeerConnection(openRelayTurnServer);

    connection.onicecandidate = (event) => {
      console.log("onicecandidate");
      if (!event.candidate) {
        return;
      }
      const key = `users/${user?.uid}/cameras/${cameraId}/offeringCandidates`; 
      addItem(key, event.candidate.toJSON());
    };
  
    connection.ontrack = (event) => {
      console.log("track event", event);
    };

    return connection;
  }, []);
  
  
  useEffect(() => {
    const key = `users/${user?.uid}/cameras/${cameraId}`;
    async function setCameraConnection () {
      if (!localStream || !localStream?.active) {
        const localMedia = await getMedia();
        dispatch?.(StreamActionCreator.setLocalStream(localMedia));
        localMedia.getTracks().forEach(track => connection.addTrack(track, localMedia));
        
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer).catch(error => console.log(error));

        const cameraWithOffer = {
          offer: {
            type: offer.type,
            sdp: offer.sdp
          }
        };

        updateItem(key, cameraWithOffer);
      }
    }

    setCameraConnection();
    
    const unsubscribeCameraDoc = onSnapshot(doc(db, key), async (snapshot) => {
      const data = snapshot.data();
      if (!connection.currentRemoteDescription && data?.answer) {
        const answer = new RTCSessionDescription(data.answer);
        await connection.setRemoteDescription(answer);
        console.log("answer received");
        }
    }, (error) => console.log(error));

    const q = query(
      collection(db, key, "answeringCandidates")
    );
    const unsubscribeAnsweringCandidatesCollection = onSnapshot(q, async (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          connection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    }, (error) => console.log(error));

    return () => {
      dispatch(StreamActionCreator.setLocalStream(null));
      unsubscribeCameraDoc();
      unsubscribeAnsweringCandidatesCollection();
      connection.close();
    };
  }, []);
  
  return (<div className="camera body-content">
    <div className="video-wrapper">
      <VideoOverlay stream={localStream} camera={camera}/>
      
      <Stream stream={localStream} />
    </div>
    <div className="remote-media">
      <ul>
        {/* TODO: key 적당한 것으로 변경 */}
        {remoteStreams?.map((remoteStream, i) => {
          return (<li key={i}>
            <Stream stream={remoteStream} />
          </li>)
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