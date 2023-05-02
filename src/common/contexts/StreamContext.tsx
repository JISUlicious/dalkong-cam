import {createContext, Dispatch, ReactNode, useContext, useReducer} from "react";

interface StreamState {
  stream: MediaStream | null,
}

type StreamActionType = "setStream";

interface Action {
  type: StreamActionType,
  stream: MediaStream | null
}

interface StreamProviderProps {
  children?: ReactNode
}

const initialState = {
  stream: null,
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
  setStream: (stream: MediaStream | null): Action => ({type: "setStream", stream: stream}),
};

export function streamReducer (streamState: StreamState, action: Action): StreamState {
  switch (action.type) {
    case "setStream": {
      return {...streamState, stream: action.stream};
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
