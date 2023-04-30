import {Auth, User} from "firebase/auth";
import {auth} from "../functions/firebaseInit";
import {createContext, ReactNode, useContext, useEffect, useReducer, Dispatch} from "react";

interface Action {
  type: string
  user?: User | null
}

interface AuthState {
  auth: Auth,
  user: User | null,
  initialized: boolean
}

interface AuthProviderProps {
  children?: ReactNode
}

const initialState: AuthState = {auth, user: null, initialized: false}
const AuthContext = createContext<AuthState>(initialState);
const AuthDispatchContext = createContext<Dispatch<Action> | null>(null);

export function useAuthContext () {
  return useContext(AuthContext);
}
export function useAuthDispatchContext () {
  return useContext(AuthDispatchContext);
}

export const authActionTypes = {
  signIn: "signIn",
  signOut: "signOut",
  initAuth: "initAuth"
};

export const authActionCreator = {
  signIn: (user: User): Action => ({type: authActionTypes.signIn, user}),
  signOut: (): Action => ({type: authActionTypes.signOut, user: null}),
  initAuth: (): Action => ({type: authActionTypes.initAuth, user: null})
};

const authReducer = (authState: AuthState, action: Action): AuthState => {
  switch (action.type) {
    case authActionTypes.signIn: {
      if (action.user !== undefined) {
        return {...authState, user: action.user}
      } else {
        throw new Error("Action dose not have 'user' key-value pair.");
      }
    }
    case authActionTypes.signOut: {
      return {...authState, user: null};
    }
    case authActionTypes.initAuth: {
      return {...authState, initialized: true}
    }
    default: {
      throw new Error("Invalid action type:" + action.type);
    }
  }
};

export const AuthProvider = ({children}: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const unsubscribe = state.auth.onAuthStateChanged(function (user: User | null) {
      if (!state.initialized) {
        dispatch(authActionCreator.initAuth());
      }
      if (user) {
        dispatch(authActionCreator.signIn(user));
      } else {
        dispatch(authActionCreator.signOut());
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthContext.Provider>
  );
};


