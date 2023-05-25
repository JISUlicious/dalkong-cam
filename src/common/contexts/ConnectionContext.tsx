import React, { createContext, Dispatch, PropsWithChildren, useContext } from "react";
import { DocumentSnapshot, Unsubscribe } from "firebase/firestore";

import { useMiddlewareReducer, middleware } from "../hooks/useReducerWithMiddleware";

export interface DeviceDoc {
  deviceName: string,
  deviceType: string,
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

export interface Subscriptions {
  [id: string]: Unsubscribe[]
}

export interface ConnectionState {
  localDevice: DeviceState | null,
  localStream: MediaStream | null,
  remoteStreams: RemoteStreams | null,
  remoteDevices: RemoteDevices,
  connections: Connections,
  subscriptions: Subscriptions
}

export type Action = {type: "setLocalDevice", device: DeviceState | null}
  | {type: "setLocalStream", stream: MediaStream | null}
  | {type: "addRemoteDevice", device: DeviceState}
  | {type: "removeRemoteDevice", id: string}
  | {type: "clearRemoteDevices"}
  | {type: "addRemoteStream", stream: MediaStream, id: string}
  | {type: "removeRemoteStream", id: string}
  | {type: "addConnection", id: string, connection: RTCPeerConnection}
  | {type: "removeConnection", id: string}
  | {
    type: "addSubscriptions",
    id: string,
    subscriptions: Unsubscribe[]
  }
  | {type: "removeSubscriptions", id: string }

const initialState = {
  localDevice: null,
  localStream: null,
  remoteStreams: {} as RemoteStreams,
  remoteDevices: {} as RemoteDevices,
  connections: {} as Connections,
  subscriptions: {} as Subscriptions
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
  setLocalDevice: (doc: DeviceState | null): Action => ({type: "setLocalDevice", device: doc}),
  setLocalStream: (stream: MediaStream| null): Action => ({type: "setLocalStream", stream: stream}),
  addRemoteDevice: (doc: DeviceState): Action => ({type: "addRemoteDevice", device: doc}),
  removeRemoteDevice: (id: string): Action => ({type: "removeRemoteDevice", id: id}),
  clearRemoteDevices: (): Action => ({type: "clearRemoteDevices"}),
  addRemoteStream: (id: string, stream: MediaStream): Action => ({type: "addRemoteStream", stream: stream, id: id}),
  removeRemoteStream: (id: string): Action => ({type: "removeRemoteStream", id: id}),
  addConnection: (id: string, connection: RTCPeerConnection): Action => ({type: "addConnection", id: id, connection: connection}),
  removeConnection: (id: string): Action => ({type: "removeConnection", id: id}),
  addSubscription: (id: string, subscriptions: Unsubscribe[]): Action => ({type: "addSubscriptions", id: id, subscriptions: subscriptions}),
  removeSubscription: (id: string): Action => ({type: "removeSubscriptions", id: id})
};

export function connectionReducer (state: ConnectionState, action: Action): ConnectionState {
  switch (action.type) {
    case "setLocalDevice": {
      return {...state, localDevice: action.device};
    }
    case "setLocalStream": {
      return {...state, localStream: action.stream};
    }
    case "addRemoteDevice": {
      return {
        ...state,
        remoteDevices: {
          ...state.remoteDevices,
          [action.device.id]: action.device
        }
      };
    }
    case "removeRemoteDevice": {
      if (state.remoteDevices?.[action.id]) {
        const remoteDevices = {...state.remoteDevices};
        delete remoteDevices[action.id];
        return {...state, remoteDevices: {...remoteDevices}};
      } else {
        console.log(`Remote device with id ${action.id} does not exist`);
        return state;
      }
    }
    case "clearRemoteDevices": {
      return {...state, remoteDevices: {} as RemoteDevices};
    }
    case "addRemoteStream": {
      return {
        ...state,
        remoteStreams: {
          ...state.remoteStreams,
          [action.id as string]: action.stream
        }
      };
    }
    case "removeRemoteStream": {
      if (state.remoteStreams?.[action.id]) {
        const remoteStreams = {...state.remoteStreams};
        delete remoteStreams[action.id];
        return {...state, remoteStreams: {...remoteStreams}};
      } else {
        console.log(`Remote stream with id ${action.id} does not exist`);
        return state;
      }
    }
    case "addConnection": {
      return {
        ...state,
        connections: {
          ...state.connections,
          [action.id]: action.connection
        }
      };
    }
    case "removeConnection": {
      if (state.connections?.[action.id]) {
        const connections = {...state.connections};
        delete connections[action.id];
        return {...state, connections: {...connections}};
      } else {
        console.log(`Connection with id ${action.id} does not exist`);
        return state;
      }
    }
    case "addSubscriptions": {
      return {
        ...state, 
        subscriptions: {
          ...state.subscriptions,
          [action.id]: action.subscriptions
        }
      }
    }
    case "removeSubscriptions": {
      if (state.subscriptions?.[action.id]) {
        const subscription = {...state.subscriptions};
        delete subscription[action.id];
        return {...state, subscriptions: {...subscription}};
      } else {
        console.log(`Subscription with id ${action.id} does not exist`);
        return state;
      }
    }
  }
}

export function ConnectionProvider ({children}: PropsWithChildren) {
  const [state, dispatch] = useMiddlewareReducer(
    connectionReducer,
    initialState,
    middleware
    );
  return (<ConnectionContext.Provider value={state}>
    <ConnectionDispatchContext.Provider value={dispatch}>
      {children}
    </ConnectionDispatchContext.Provider>
  </ConnectionContext.Provider>)
}

