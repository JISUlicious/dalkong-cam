import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { db } from "../../common/functions/firebaseInit";
import { updateItem } from "../../common/functions/storage";

export function getCameraSubscriptions(
    viewerKey: string,
    localStream: MediaStream,
    connection: RTCPeerConnection
    ) {

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

    return [unsubscribeDescriptions, unsubscribeICECandidates];
}