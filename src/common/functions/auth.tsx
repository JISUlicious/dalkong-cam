import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {auth} from "./firebaseInit";


export function signInEmail (id: string, pw: string) {
  return signInWithEmailAndPassword(auth, id, pw);
}

export function signOutApp () {
  return signOut(auth);
}

export function signUpEmail (id: string, pw: string) {
  return createUserWithEmailAndPassword(auth, id, pw);
}
