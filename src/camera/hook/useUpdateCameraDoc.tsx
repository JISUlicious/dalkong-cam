import { Firestore, doc, getDoc } from "firebase/firestore";
import { useEffect } from "react";
import { updateItem } from "../../common/functions/storage";
import { User } from "firebase/auth";
import { Action, ConnectionActionCreator, DeviceState } from "../../common/contexts/ConnectionContext";

export function useUpdateCameraDoc(
  user: User | null,
  localDevice: DeviceState | null,
  db: Firestore,
  isRecording: boolean,
  dispatch: React.Dispatch<Action>,
  ) {
  useEffect(() => {
    if (user && localDevice) {
      const key = `users/${user.uid}/cameras/${localDevice.id}`;
      getDoc(doc(db, key))
        .then(doc => {
          const updatedDoc = doc.data()!;
          updatedDoc.isRecording = isRecording;
          return updateItem(key, updatedDoc);
        })
        .then(() => getDoc(doc(db, key)))
        .then(doc => dispatch(ConnectionActionCreator.setLocalDevice(doc as DeviceState)));
    }
  }, [user, !!localDevice, isRecording]);
}