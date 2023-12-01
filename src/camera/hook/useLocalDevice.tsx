import { useEffect } from "react";
import { getItem, removeItem, removeItems, updateItem } from "../../common/functions/storage";
import { Firestore, doc, getDoc } from "firebase/firestore";
import { User } from "firebase/auth";
import { Action, ConnectionActionCreator, DeviceState } from "../../common/contexts/ConnectionContext";

export function useLocalDevice(
  user: User | null,
  localDevice: DeviceState | null,
  cameraId: string | undefined,
  db: Firestore,
  dispatch: React.Dispatch<Action>,
) {
  useEffect(() => {
    if (!localDevice && user) {
      const key = `users/${user.uid}/cameras/${cameraId}`;
      getItem(`${key}/connections`)
        .then(snapshot => {
          snapshot.forEach(doc => {
            removeItems(`${doc.ref.path}/offeringCandidates`);
            removeItems(`${doc.ref.path}/answeringCandidates`);
            removeItem(doc.ref.path);
          });
        });

      getDoc(doc(db, key))
        .then(doc => {
          const updatedDoc = doc.data()!;
          updatedDoc.sessionId = Date.now();
          updateItem(key, updatedDoc);
          dispatch(ConnectionActionCreator.setLocalDevice(doc as DeviceState));
        });
    }
  }, [user, localDevice]);
}