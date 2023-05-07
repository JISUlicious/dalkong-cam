import { DocumentData, DocumentSnapshot } from "firebase/firestore";
import React, { createContext, Dispatch, ReactNode, useContext, useReducer } from "react";

export type CameraState = DocumentSnapshot<DocumentData>;

interface RemoteStreams {
  [id: string]: MediaStream
}

interface StreamState {
  camera?: CameraState,
  localStream: MediaStream | null,
  remoteStreams?: RemoteStreams | null,
  remoteCameras: CameraState[],
}

type StreamActionType = "setCamera" | "setLocalStream" | "toggleMuteLocalStream" | "addRemoteCamera" | "addRemoteStream";

export interface Action {
  type: StreamActionType,
  stream?: MediaStream | null,
  camera?: CameraState,
  id?: string
}

interface StreamProviderProps {
  children?: ReactNode
}

const initialState = {
  localStream: null,
  remoteCameras: [] as CameraState[]
};

const StreamContext = createContext<StreamState>(initialState);
const StreamDispatchContext = createContext<Dispatch<Action>>({} as Dispatch<Action>);

export function useStreamContext () {
  return useContext(StreamContext);
}
export function useStreamDispatchContext () {
  return useContext(StreamDispatchContext);
}

export const StreamActionCreator = {
  addRemoteCamera: (doc: CameraState): Action => ({type: "addRemoteCamera", camera: doc}),
  addRemoteStream: (id: string, stream: MediaStream): Action => ({type: "addRemoteStream", stream: stream, id: id}),
  setCamera: (doc: CameraState): Action => ({type: "setCamera", camera: doc}),
  setLocalStream: (stream: MediaStream): Action => ({type: "setLocalStream", stream: stream}),
  toggleMuteLocalStream: (): Action => ({type: "toggleMuteLocalStream"}),
};

export function streamReducer (streamState: StreamState, action: Action): StreamState {
  switch (action.type) {
    case "setCamera": {
      if (action?.camera) {
        return {...streamState, camera: action.camera}
      } else {
        throw new Error("'setCamera' action requires 'camera'");
      }
    }
    case "setLocalStream": {
      if (action?.stream) {
        return {...streamState, localStream: action.stream};
      } else {
        throw new Error("'setLocalStream' action requires 'stream'");
      }
    }
    case "toggleMuteLocalStream": {
      if (streamState.localStream) {
        streamState.localStream?.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      } 
      return {...streamState};
    }
    case "addRemoteCamera": {
      if (action?.camera) {
        return {...streamState, remoteCameras: [...streamState.remoteCameras, action.camera]}
      } else {
        throw new Error("'addRemoteCamera' action requires 'camera'");
      }
    }
    case "addRemoteStream": {
      if (action?.stream) {
        return {...streamState, remoteStreams: {...streamState.remoteStreams, [action.id as string]: action.stream}}
      } else {
        throw new Error("'addRemoteStream' action requires 'id' and 'stream");
      }
    }
    default: {
      throw new Error("Invalid action type:" + action.type);
    }
  }
}

export function StreamProvider ({children}: StreamProviderProps) {
  const [state, dispatch] = useReducer(streamReducer, initialState);
  return (<StreamContext.Provider value={state}>
    <StreamDispatchContext.Provider value={dispatch}>
      {children}
    </StreamDispatchContext.Provider>
  </StreamContext.Provider>)
}
