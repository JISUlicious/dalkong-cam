import "../../common/styles/Camera.scss";
import { useParams } from "react-router-dom";
import { VideoItem } from "../../viewer/components/VideoItem";
import { Stream } from "../../common/components/Stream";
import React, { Dispatch, ReactNode, useEffect, useMemo, useState } from "react";
import { getMedia } from "../../common/functions/getMedia";
import {
  Action,
  StreamActionCreator,
  useStreamContext,
  useStreamDispatchContext
} from "../../common/contexts/StreamContext";
import openRelayTurnServer from "../../turnSettings";
import { useAuthContext } from "../../common/contexts/AuthContext";
import { addItem, removeItem, removeItems, updateItem } from "../../common/functions/storage";
import { VideoOverlay } from "../../common/components/VideoOverlay";
import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { db } from "../../common/functions/firebaseInit";
import { AudioStream } from "./AudioStream";

// TODO:
// 여러 뷰어가 있을 때도 작동하도록 만들기
// 뷰어 재접속 시 뷰어에서 연결 안되는 문제 해결하기


async function removeCamera(key: string) {
  await removeItems(key + "/answeringCandidates");
  await removeItems(key + "/offeringCandidates");
  await removeItem(key);
}

async function setCameraConnection (
  localStream: MediaStream | null,
  dispatch: Dispatch<Action>,
  connection: RTCPeerConnection,
  key: string
  ) {
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

export function Camera () {
  const {user} = useAuthContext();
  const {cameraId} = useParams();
  const {camera, localStream, remoteStreams} = useStreamContext();
  const [viewerItems, setViewerItems] = useState<ReactNode[]>([] as ReactNode[]);
  const dispatch = useStreamDispatchContext();
  const savedTimes = ["2023-02-01 12:00:00", "2023-02-01 12:05:00", "2023-02-01 12:10:00", "a", "ddd", "aaa"];

  const connection = useMemo(() => {
    const connection = new RTCPeerConnection(openRelayTurnServer);

    connection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }
      const key = `users/${user?.uid}/cameras/${cameraId}/offeringCandidates`; 
      addItem(key, event.candidate.toJSON());
    };
  
    connection.ontrack = (event) => {
      console.log("track event", event);

    };

    connection.onconnectionstatechange = (event) => {
      console.log(event);
      console.log(connection.connectionState);
    };

    return connection;
  }, []);
  
  
  useEffect(() => {
    const key = `users/${user?.uid}/cameras/${cameraId}`;
    
    setCameraConnection(localStream, dispatch, connection, key);
    
    const unsubscribeCameraDoc = onSnapshot(doc(db, key), async (snapshot) => {
      const data = snapshot.data();
      if (!connection.currentRemoteDescription && data?.answer) {
        const answer = new RTCSessionDescription(data.answer);
        await connection.setRemoteDescription(answer);
      } else if (connection.currentRemoteDescription && !data?.answer) {
        connection.close();
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
      const key = `users/${user?.uid}/cameras/${cameraId}`;
      removeCamera(key);
    };
  }, []);
  
  useEffect(() => {
    if (remoteStreams) {
      for (const [id, stream] of Object.entries(remoteStreams)) {
        const viewerAudio = (<li key={id}>
          <AudioStream stream={stream} />
        </li>);
        setViewerItems(prev => [...prev, viewerAudio]);
      }
    }
  }, [remoteStreams]);
  
  return (<div className="camera body-content">
    <div className="video-wrapper">
      <VideoOverlay stream={localStream} camera={camera}/>
      
      <Stream stream={localStream} />
    </div>
    <div className="remote-media">
      <ul>
        {remoteStreams ? viewerItems : null}
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