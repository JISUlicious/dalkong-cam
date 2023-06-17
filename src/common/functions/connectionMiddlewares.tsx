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
  } else if ((action.type === "setLocalStream" && action.stream && api.getState().localStream)) {
    const state = api.getState();
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }
    const connections = state.connections;
    Object.entries(connections).map(([remoteId, connection]) => {
      const senders = connection.getSenders();
      const videoSender = senders.find((sender) => sender.track?.kind === "video");
      videoSender?.replaceTrack(action.stream!.getVideoTracks()[0]);
      const audioSender = senders.find((sender) => sender.track?.kind === "audio");
      audioSender?.replaceTrack(action.stream!.getAudioTracks()[0]);
      api.dispatch(ConnectionActionCreator.setConnection(remoteId, connection));
    });
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
    const remoteDeviceType = localDeviceType === "viewer" ? "camera" : "viewer";
    
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

    state.subscriptions[`${remoteDeviceType}sCollection`][0]();
    api.dispatch(ConnectionActionCreator.removeSubscription(`${remoteDeviceType}sCollection`));
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
    
    const connection = getConnection(localDevice!, sdpType, connectionKey, action, api.dispatch, localStream);
    
    const [unsubDescriptions, unsubICECandidates] = getConnectionDocSubscriptions(
      localDeviceType!, 
      sdpType, 
      connectionKey, 
      connection, 
      localStream
      );

    api.dispatch(ConnectionActionCreator.setConnection(action.device.id, connection));
    api.dispatch(ConnectionActionCreator.addSubscription(
      action.device.id,
      [unsubDescriptions, unsubICECandidates]
      ));
  }
  next(action);
};

export const removeRemoteDevice = (api: MiddlewareAPI<ConnectionState>) =>
(next: Dispatch) =>
(action: Action) => {
  if (action.type === "removeRemoteDevice") {
    const id = action.id;
    const state = api.getState();
    state.remoteStreams?.[id]?.getTracks().forEach(track => track.stop());
    api.dispatch(ConnectionActionCreator.removeRemoteStream(id));
    state.subscriptions?.[id]?.forEach(unsub => unsub());
    api.dispatch(ConnectionActionCreator.removeSubscription(id));
    state.connections?.[id]?.close()
    api.dispatch(ConnectionActionCreator.removeConnection(id));
  }
  next(action);
};

export const logger = (api: MiddlewareAPI<ConnectionState>) =>
(next: Dispatch) =>
(action: Action) => {
  console.log("before", api.getState());
  console.log("action", action);
  next(action);
  console.log("after", api.getState());
};