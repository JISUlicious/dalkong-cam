import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider
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

export const OAuthProviderName = {
  google: "Google",
  facebook: "Facebook"
};

export function signInOAuth (OAuthType: string) {
  const providerTypes = {
    [OAuthProviderName.google]: new GoogleAuthProvider(),
    [OAuthProviderName.facebook]: new FacebookAuthProvider()
  };
  const provider = providerTypes[OAuthType];

  return signInWithPopup(auth, provider);
}