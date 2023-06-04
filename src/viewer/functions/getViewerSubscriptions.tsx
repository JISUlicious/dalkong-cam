import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { DeviceState } from "../../common/contexts/ConnectionContext";
import { db } from "../../common/functions/firebaseInit";

export function getViewerSubscriptions(
    cameraKey: string,
    localDevice: DeviceState,
    connection: RTCPeerConnection
    ) {

    const viewerKey = cameraKey + "/viewers/" + localDevice?.id;
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

    return [unsubscribeDescriptions, unsubscribeICECandidates];
}