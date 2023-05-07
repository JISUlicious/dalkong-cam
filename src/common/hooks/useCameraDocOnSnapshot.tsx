import { doc, onSnapshot } from "firebase/firestore";
import { Dispatch, useEffect } from "react";
import { db } from "../functions/firebaseInit";
import { Action } from "../contexts/StreamContext";


export const useCameraDocOnSnapshotChange = (uid: string, cameraId: string, connection: RTCPeerConnection, dispatch: Dispatch<Action>) => {
    useEffect(() => {
      if (uid && cameraId) {
        const key = `users/${uid}/cameras/${cameraId}`;
        const unsubscribe = onSnapshot(doc(db, key), (snapshot) => {
          const data = snapshot.data();
          if (!connection.currentRemoteDescription && data?.answer) {
            const answer = new RTCSessionDescription(data.answer)
            connection.setRemoteDescription(answer);
            }
        }, (error) => console.log(error));
        return () => unsubscribe();
      }
      }, [uid, cameraId, connection]
    );
  };