import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { db } from "./firebaseInit";
import { updateItem } from "./storage";


export function getConnectionDocSubscriptions (
  localDeviceType: string,
  sdpType: "offer" | "answer",
  connectionKey: string,
  connection: RTCPeerConnection,
  localStream: MediaStream | null
  ) {

    const unsubscribeDescriptions = onSnapshot(doc(db, connectionKey), async (snapshot) => {
    const data = snapshot.data();
    if (localDeviceType === "viewer" && !connection?.currentRemoteDescription && data?.answer) {
      const answer = new RTCSessionDescription(data.answer);
      connection?.setRemoteDescription(answer);
    } else if (localDeviceType === "camera" && !connection.currentRemoteDescription && data?.offer) {
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
      updateItem(connectionKey, viewerWithAnswer);
    }
  }, (error) => console.log(error));

  const sdpTypeToSubscribe = sdpType === "offer" ? "answer" : "offer";
  const q = query(
    collection(db, connectionKey, `${sdpTypeToSubscribe}ingCandidates`)
  );
  const unsubscribeICECandidates = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        connection?.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  }, (error) => console.log(error));  

  return [unsubscribeDescriptions, unsubscribeICECandidates];
}