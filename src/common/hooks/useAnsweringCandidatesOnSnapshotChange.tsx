import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { Dispatch, useEffect } from "react";
import { db } from "../functions/firebaseInit";
import { Action } from "../contexts/StreamContext";


export const useAnsweringCandidatesOnSnapshotChange = (uid: string, cameraId: string, connection: RTCPeerConnection, dispatch: Dispatch<Action>) => {
    useEffect(() => {
      if (uid && cameraId) {
        const key = `users/${uid}/cameras/${cameraId}/answeringCandidates`;
        const q = query(
          collection(db, key)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
          console.log("added", snapshot);
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              console.log(data);
              connection.addIceCandidate(new RTCIceCandidate(data));
            }
          });
        }, (error) => console.log(error));
        console.log("connection state", connection.connectionState);
        return () => unsubscribe();
      }
      }, [uid, cameraId, connection]
    );
  };