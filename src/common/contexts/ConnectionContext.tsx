import { Unsubscribe } from "firebase/auth";
import { DocumentSnapshot } from "firebase/firestore";
import React, { createContext, Dispatch, PropsWithChildren, useContext, useReducer } from "react";

export interface DeviceDoc {
  deviceName: string,
  offer?: RTCSessionDescriptionInit,
  answer?: RTCSessionDescriptionInit
}

export type DeviceState = DocumentSnapshot<DeviceDoc>;

interface RemoteStreams {
  [id: string]: MediaStream
}

interface RemoteDevices {
  [id: string]: DeviceState
}

interface Connections {
  [id: string]: RTCPeerConnection
}

interface ConnectionState {
  localDevice: DeviceState | null,
  localStream: MediaStream | null,
  remoteStreams: RemoteStreams | null,
  remoteDevices: RemoteDevices,
  connections: Connections,
}

type StreamActionType = "setLocalDevice"
  | "setLocalStream" 
  | "toggleMuteLocalStream" 
  | "addRemoteDevice" 
  | "clearRemoteDevices"
  | "addRemoteStream"
  | "removeRemoteStream"
  | "addConnection"
  | "removeConnection";

export interface Action {
  type: StreamActionType,
  stream?: MediaStream | null,
  device?: DeviceState,
  id?: string,
  connection?: RTCPeerConnection
}

const initialState = {
  localDevice: null,
  localStream: null,
  remoteStreams: {} as RemoteStreams,
  remoteDevices: {} as RemoteDevices,
  connections: {} as Connections
};

const ConnectionContext = createContext<ConnectionState>(initialState);
const ConnectionDispatchContext = createContext<Dispatch<Action>>({} as Dispatch<Action>);

export function useConnectionContext () {
  return useContext(ConnectionContext);
}
export function useConnectionDispatchContext () {
  return useContext(ConnectionDispatchContext);
}

export const ConnectionActionCreator = {
  setLocalDevice: (doc: DeviceState): Action => ({type: "setLocalDevice", device: doc}),
  setLocalStream: (stream: MediaStream| null): Action => ({type: "setLocalStream", stream: stream}),
  toggleMuteLocalStream: (): Action => ({type: "toggleMuteLocalStream"}),
  addRemoteDevice: (doc: DeviceState): Action => ({type: "addRemoteDevice", device: doc}),
  clearRemoteDevices: (): Action => ({type: "clearRemoteDevices"}),
  addRemoteStream: (id: string, stream: MediaStream): Action => ({type: "addRemoteStream", stream: stream, id: id}),
  removeRemoteStream: (id: string): Action => ({type: "removeRemoteStream", id: id}),
  addConnection: (id: string, connection: RTCPeerConnection): Action => ({type: "addConnection", id: id, connection: connection}),
  removeConnection: (id: string): Action => ({type: "removeConnection", id: id}),
};

export function connectionReducer (state: ConnectionState, action: Action): ConnectionState {
  switch (action.type) {
    case "setLocalDevice": {
      if (action?.device) {
        return {...state, localDevice: action.device};
      } else {
        throw new Error("'setLocalDevice' action requires 'device'");
      }
    }
    case "setLocalStream": {
      if (action?.stream) {
        return {...state, localStream: action.stream};
      } else if (action.stream === null) {
        state.localStream?.getTracks().forEach(track => track.stop());
        return {...state, localStream: null};
      } else {
        throw new Error("'setLocalStream' action requires 'stream'");
      }
    }
    case "toggleMuteLocalStream": {
      if (state.localStream) {
        state.localStream?.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      } 
      return {...state};
    }
    case "addRemoteDevice": {
      if (action?.device) {
        return {
          ...state,
          remoteDevices: {
            ...state.remoteDevices,
            [action.device.id]: action.device
          }
        };
      } else {
        throw new Error("'addRemoteDevice' action requires 'device'");
      }
    }
    case "clearRemoteDevices": {
      return {...state, remoteDevices: {} as RemoteDevices};
    }
    case "addRemoteStream": {
      if (action?.stream) {
        return {
          ...state,
          remoteStreams: {
            ...state.remoteStreams,
            [action.id as string]: action.stream
          }
        };
      } else {
        throw new Error("'addRemoteStream' action requires 'id' and 'stream");
      }
    }
    case "removeRemoteStream": {
      if (action?.id && state.remoteStreams?.[action.id]) {
        state.remoteStreams?.[action.id].getTracks().forEach(track => track.stop());
        delete state.remoteStreams[action.id];
        return {...state, remoteStreams: {...state.remoteStreams}};
      } else {
        throw new Error("'removeRemoteStream' action requires 'id'");
      }
    }
    default: {
      throw new Error("Invalid action type:" + action.type);
    }
  }
}

export function ConnectionProvider ({children}: PropsWithChildren) {
  const [state, dispatch] = useReducer(connectionReducer, initialState);
  return (<ConnectionContext.Provider value={state}>
    <ConnectionDispatchContext.Provider value={dispatch}>
      {children}
    </ConnectionDispatchContext.Provider>
  </ConnectionContext.Provider>)
}
