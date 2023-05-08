import { DocumentData, DocumentSnapshot } from "firebase/firestore";
import React, { createContext, Dispatch, PropsWithChildren, ReactNode, useContext, useReducer } from "react"

export interface CameraDoc {
  cameraName: string,
  offer?: RTCSessionDescriptionInit,
  answer?: RTCSessionDescriptionInit
}

export type CameraState = DocumentSnapshot<CameraDoc>;

interface RemoteStreams {
  [id: string]: MediaStream
}

interface RemoteCameras {
  [id: string]: CameraState
}

interface StreamState {
  camera: CameraState | null,
  localStream: MediaStream | null,
  remoteStreams: RemoteStreams | null,
  remoteCameras: RemoteCameras | null
}

type StreamActionType = "setCamera" 
  | "setLocalStream" 
  | "toggleMuteLocalStream" 
  | "addRemoteCamera" 
  | "addRemoteStream"
  | "removeRemoteStream";

export interface Action {
  type: StreamActionType,
  stream?: MediaStream | null,
  camera?: CameraState,
  id?: string
}

const initialState = {
  camera: null,
  localStream: null,
  remoteStreams: {} as RemoteStreams,
  remoteCameras: {} as RemoteCameras
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
  setLocalStream: (stream: MediaStream| null): Action => ({type: "setLocalStream", stream: stream}),
  toggleMuteLocalStream: (): Action => ({type: "toggleMuteLocalStream"}),
  removeRemoteStream: (id: string): Action => ({type: "removeRemoteStream", id: id})
};

export function streamReducer (streamState: StreamState, action: Action): StreamState {
  switch (action.type) {
    case "setCamera": {
      if (action?.camera) {
        return {...streamState, camera: action.camera};
      } else {
        throw new Error("'setCamera' action requires 'camera'");
      }
    }
    case "setLocalStream": {
      if (action?.stream) {
        console.log(action.stream);
        return {...streamState, localStream: action.stream};
      } else if (action.stream === null) {
        streamState.localStream?.getTracks().forEach(track => {
          console.log("stopping tracks");
          track.stop()});
        return {...streamState, localStream: null};
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
        return {...streamState, remoteCameras: {...streamState.remoteCameras, [action.camera.id]: action.camera}};
      } else {
        throw new Error("'addRemoteCamera' action requires 'camera'");
      }
    }
    case "addRemoteStream": {
      if (action?.stream) {
        return {...streamState, remoteStreams: {...streamState.remoteStreams, [action.id as string]: action.stream}};
      } else {
        throw new Error("'addRemoteStream' action requires 'id' and 'stream");
      }
    }
    case "removeRemoteStream": {
      if (action?.id && streamState.remoteStreams?.[action!.id]) {
        streamState.remoteStreams?.[action!.id].getTracks().forEach(track => {
          console.log("stopping remote tracks");
          track.stop();
        });
        delete streamState.remoteStreams[action!.id];
        return {...streamState, remoteStreams: {...streamState.remoteStreams}};
      } else {
        throw new Error("'removeRemoteStream' action requires 'id'");
      }
    }
    default: {
      throw new Error("Invalid action type:" + action.type);
    }
  }
}

export function StreamProvider ({children}: PropsWithChildren) {
  const [state, dispatch] = useReducer(streamReducer, initialState);
  return (<StreamContext.Provider value={state}>
    <StreamDispatchContext.Provider value={dispatch}>
      {children}
    </StreamDispatchContext.Provider>
  </StreamContext.Provider>)
}
