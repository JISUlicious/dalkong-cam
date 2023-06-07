import { Action, ConnectionActionCreator, ConnectionState } from "../contexts/ConnectionContext";
import { Dispatch, MiddlewareAPI } from "../hooks/useReducerWithMiddleware";
import { getConnection } from "./getConnection";
import { getConnectionDocSubscriptions } from "./getConnectionDocSubscriptions";
import { removeItem, removeItems } from "./storage";

export const setLocalStream = (api: MiddlewareAPI<ConnectionState>) =>
(next: Dispatch) =>
(action: Action) => {
  if (action.type === "setLocalStream" && action.stream === null) {
    const currStream = api.getState().localStream;
    currStream?.getTracks().forEach(track => track.stop());
  }
  next(action);
};

export const setLocalDevice = (api: MiddlewareAPI<ConnectionState>) =>
(next: Dispatch) =>
(action: Action) => {
  if (action.type === "setLocalDevice" && action.device === null) {
    const state = api.getState();
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

    Object.keys(remoteDevices).map(id => {
      api.dispatch(ConnectionActionCreator.removeRemoteDevice(id))
    });
  }
  
  next(action);
};

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
    
    const connection = getConnection(localDeviceType!, sdpType, connectionKey, action, api.dispatch, localStream);
    
    const [unsubDescriptions, unsubICECandidates] = getConnectionDocSubscriptions(localDeviceType!, sdpType, connectionKey, connection, localStream);
    
    api.dispatch(ConnectionActionCreator.addConnection(action.device.id, connection));
    api.dispatch(ConnectionActionCreator.addSubscription(action.device.id, [unsubDescriptions, unsubICECandidates]));
  }
  next(action);
};

export const removeRemoteDevice = (api: MiddlewareAPI<ConnectionState>) =>
(next: Dispatch) =>
(action: Action) => {
  if (action.type === "removeRemoteDevice") {
    const id = action.id;
    const state = api.getState();
    state.remoteStreams?.[id].getTracks().forEach(track => track.stop());
    api.dispatch(ConnectionActionCreator.removeRemoteStream(id));
    state.subscriptions?.[id].forEach(unsub => unsub());
    api.dispatch(ConnectionActionCreator.removeSubscription(id));
    state.connections?.[id].close()
    api.dispatch(ConnectionActionCreator.removeConnection(id));
  }
  next(action);
};

export const loger = (api: MiddlewareAPI<ConnectionState>) =>
(next: Dispatch) =>
(action: Action) => {
  console.log("before", api.getState());
  const result = next(action);
  console.log("after", api.getState());
  
};