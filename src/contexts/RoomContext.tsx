import {createContext, Dispatch, ReactNode, useContext, useReducer} from "react";

interface RoomState {
  roomName: string | null,
  host: boolean,
}

interface Action {
  type: string,
  roomName: string | null
}

interface RoomContextProviderProps {
  children?: ReactNode
}

const initialRoomState: RoomState = {
  roomName: null,
  host: false
};
const RoomContext = createContext<RoomState | null>(null);
const RoomDispatchContext = createContext<Dispatch<Action> | null>(null);


export function useRoomContext () {
  return useContext(RoomContext);
}

export function useRoomDispatchContext () {
  return useContext(RoomDispatchContext);
}

const roomActionTypes = {
  create: "create",
  join: "join",
  exit: "exit"
};

export const roomActionCreator = {
  create: (roomName: string): Action => ({type: roomActionTypes.create, roomName: roomName}),
  join: (roomName: string): Action => ({type: roomActionTypes.join, roomName: roomName}),
  exit: (): Action => ({type: roomActionTypes.exit, roomName: null})
}

function roomReducer (state: RoomState, action: Action): RoomState {
  switch (action.type) {
    case roomActionTypes.create: {
      // create new room
      return {...state, roomName: action.roomName, host: true}
    }
    case roomActionTypes.join: {
      // join existing room
      return {...state, roomName: action.roomName};
    }
    case roomActionTypes.exit: {
      // exit room
      return {...state, roomName: null}
    }
    default: {
      throw new Error("Invalid action type:" + action.type);
    }
  }
}

export function RoomContextProvider ({children}: RoomContextProviderProps) {
  const [state, dispatch] = useReducer(roomReducer, initialRoomState);

  return (
    <RoomContext.Provider value={state}>
      <RoomDispatchContext.Provider value={dispatch}>
        {children}
      </RoomDispatchContext.Provider>
    </RoomContext.Provider>
  );
}