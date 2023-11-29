import { User } from "firebase/auth";
import { useEffect } from "react";
import { Action, ConnectionActionCreator, Connections, DeviceState } from "../../common/contexts/ConnectionContext";
import { Firestore, collection, doc, onSnapshot, query } from "firebase/firestore";

export function useCameraDocSubscription(
  user: User | null, 
  localDevice: DeviceState | null, 
  localStream: MediaStream | null, 
  connections: Connections, 
  db: Firestore, 
  dispatch: React.Dispatch<Action>
) {
  useEffect(() => {
    if (user && localDevice && localStream) {
      if (Object.keys(connections).length === 0) {
        const key = `users/${user.uid}/cameras/${localDevice.id}`;
        const viewersQuery = query(
          collection(db, key, "connections")
        );

        const unsubscribeViewersCollection = onSnapshot(viewersQuery, async (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === "added") {
              dispatch(ConnectionActionCreator.addRemoteDevice(change.doc as DeviceState));
            } else if (change.type === "removed") {
              dispatch(ConnectionActionCreator.removeRemoteDevice(change.doc.id));
            }
          });
        }, (error) => console.log(error));
        return (() => unsubscribeViewersCollection());
      }
    }
  }, [user, !!localDevice, !!localStream]);
}
