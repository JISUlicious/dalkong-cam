import { Action, ConnectionActionCreator, ConnectionState } from "../contexts/ConnectionContext";
import { Dispatch, MiddlewareAPI } from "../hooks/useReducerWithMiddleware";
import { getConnection } from "./getConnection";
import { getConnectionDocSubscriptions } from "./getConnectionDocSubscriptions";

export const setLocalStream = (api: MiddlewareAPI<ConnectionState>) =>
  (next: Dispatch) =>
  (action: Action) => {
    if (action.type === "setLocalStream" && action.stream === null) {
      const currStream = api.getState().localStream;
      currStream?.getTracks().forEach(track => track.stop());
    }
    return next(action);
  }

export const addRemoteDevice = (api: MiddlewareAPI<ConnectionState>) =>
  (next: Dispatch) =>
  async (action: Action) => {
    if (action.type === "addRemoteDevice") {
      const localDevice = api.getState().localDevice;
      const localDeviceType = localDevice?.data()?.deviceType;
      const sdpType = localDeviceType === "viewer" ? "offer" : "answer";
      const localStream = api.getState().localStream;

      const connectionKey = localDeviceType === "viewer" 
        ? `${action.device.ref.path}/connections/${localDevice?.id}`
        : `${localDevice?.ref.path}/connections/${action.device.id}`;
      
      const connection = getConnection(localDeviceType!, sdpType, connectionKey, action, next, localStream);
      
      const [unsubDescriptions, unsubICECandidates] = getConnectionDocSubscriptions(localDeviceType!, sdpType, connectionKey, connection, localStream);
      
      next(ConnectionActionCreator.addConnection(action.device.id, connection));
      next(ConnectionActionCreator.addSubscription(action.device.id, [unsubDescriptions, unsubICECandidates]));
    }
    return next(action);
  }

export const loger = (api: MiddlewareAPI<ConnectionState>) =>
  (next: Dispatch) =>
  (action: Action) => {
    console.log("before", api.getState());
    const result = next(action);
    console.log("after", api.getState());
    return result;
  }