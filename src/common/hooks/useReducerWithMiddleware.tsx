import { useReducer } from "react";
import { Action, ConnectionActionCreator, ConnectionState } from "../contexts/ConnectionContext";
import { removeItem, removeItems } from "../functions/storage";
import { getConnection } from "../functions/getConnection";
import { getConnectionDocSubscriptions } from "../functions/getConnectionDocSubscriptions";

export type Dispatch = (action: any) => any

export type MiddlewareAPI<A> = { getState: () => A; dispatch: Dispatch }

export type Middleware<A, B, Dispatch> = (state: A, action: B, dispatch: Dispatch) => void

export function useMiddlewareReducer<A, B> (
  reducer: (state: A, action: B) => A,
  initialState: A,
  middleware: Middleware<A, B, Dispatch>
): [A, Dispatch] {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  const dispatchWithMiddleware = async (action: B) => {
    middleware(state, action, dispatch);
    dispatch(action);
  }

  return [state, dispatchWithMiddleware];
}


export function middleware (state:ConnectionState, action: Action, dispatch: Dispatch) {
  switch (action.type) {
    case "setLocalDevice": {
      if (action.device === null) {
        const localDevice = state.localDevice;
        const localDeviceType = localDevice?.data()?.deviceType;
        const remoteDevices = state.remoteDevices;
        if (localDeviceType === "viewer") {
          Object.keys(remoteDevices).map(id => {
            const connectionKey = `${remoteDevices[id].ref.path}/connections/${localDevice!.id}`;
            removeItems(connectionKey + "/offeringCandidates");
            removeItems(connectionKey + "/answeringCandidates");
            removeItem(connectionKey);
          });
          removeItem(localDevice!.ref.path);
        } else {
          Object.keys(remoteDevices).map(id => {
            const connectionKey = `${remoteDevices[id].ref.path}`;
            removeItems(connectionKey + "/offeringCandidates");
            removeItems(connectionKey + "/answeringCandidates");
            removeItem(connectionKey);
          });
          removeItem(localDevice!.ref.path);
        }
      }
      return null;
    }
    case "setLocalStream": {
      if (action.stream === null) {
        const currStream = state.localStream;
        currStream?.getTracks().forEach(track => track.stop());
      }
      return null;
    }
    case "addRemoteDevice": {
      const localDevice = state.localDevice;
      const localDeviceType = localDevice?.data()?.deviceType;
      const sdpType = localDeviceType === "viewer" ? "offer" : "answer";
      const localStream = state.localStream;

      const connectionKey = localDeviceType === "viewer" 
        ? `${action.device.ref.path}/connections/${localDevice?.id}`
        : `${localDevice?.ref.path}/connections/${action.device.id}`;
      
      const connection = getConnection(localDeviceType!, sdpType, connectionKey, action, dispatch, localStream);
      
      const [unsubDescriptions, unsubICECandidates] = getConnectionDocSubscriptions(localDeviceType!, sdpType, connectionKey, connection, localStream);
      
      dispatch(ConnectionActionCreator.addConnection(action.device.id, connection));
      dispatch(ConnectionActionCreator.addSubscription(action.device.id, [unsubDescriptions, unsubICECandidates]));

      return null;
    }
    case "removeRemoteDevice": {
      const id = action.id;
      state.remoteStreams?.[id].getTracks().forEach(track => track.stop());
      dispatch(ConnectionActionCreator.removeRemoteStream(id));
      state.subscriptions?.[id].forEach(unsub => unsub());
      dispatch(ConnectionActionCreator.removeSubscription(id));
      state.connections?.[id].close()
      dispatch(ConnectionActionCreator.removeConnection(id));
      return null;
    }
    default: {
      return null;
    }
  } 
}