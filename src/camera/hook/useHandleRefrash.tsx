import { useEffect } from "react";
import { getItem, removeItem, removeItems, updateItem } from "../../common/functions/storage";
import { Firestore, doc, getDoc } from "firebase/firestore";
import { User } from "firebase/auth";
import { Action, ConnectionActionCreator, DeviceState } from "../../common/contexts/ConnectionContext";

export function useHandleRefrash(
  user: User | null,
  localDevice: DeviceState | null,
  cameraId: string | undefined,
  db: Firestore,
  dispatch: React.Dispatch<Action>,
) {
  useEffect(() => {
    if (!localDevice && user) {
      getItem(`users/${user.uid}/cameras/${cameraId}/connections`)
        .then(snapshot => {
          snapshot.forEach(doc => {
            removeItems(`${doc.ref.path}/offeringCandidates`);
            removeItems(`${doc.ref.path}/answeringCandidates`);
            removeItem(doc.ref.path);
          });
        });

      getDoc(doc(db, `users/${user.uid}/cameras/${cameraId}`))
        .then(doc => {
          const updatedDoc = doc.data()!;
          updatedDoc.sessionId = Date.now();
          updateItem(`users/${user.uid}/cameras/${cameraId}`, updatedDoc);
          dispatch(ConnectionActionCreator.setLocalDevice(doc as DeviceState));
        });
    }
  }, [user, localDevice]);
}