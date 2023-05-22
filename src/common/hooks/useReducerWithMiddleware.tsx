import { useReducer } from "react";
import { Action, ConnectionState } from "../contexts/ConnectionContext";


// TODO: camera일떄의 작동과 viewer일때의 작동을 어떻게 구분할지?

export function useReducerWithMiddleware(
  reducer: (state: ConnectionState, action: Action) => ConnectionState,
  initialState: ConnectionState,
  middlewareFn: (state: ConnectionState, action: Action) => void
) {
  const [state, dispatch] = useReducer(reducer, initialState);

  function dispatchWithMiddleware(action: Action) {
    middlewareFn(state, action);
    dispatch(action);
  }

  return [state, dispatchWithMiddleware];
}

export function connectionReducerMiddleware (state: ConnectionState, action: Action) {
  switch (action.type) {
    case "addRemoteDevice": {
      // 
    }
  }
}