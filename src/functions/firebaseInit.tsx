import {initializeApp} from "firebase/app";
import {getAuth} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC4kRMmFgqHPCt-wlCkKcxInXo1NEFlN4E",
  authDomain: "dalkong-cam.firebaseapp.com",
  projectId: "dalkong-cam",
  storageBucket: "dalkong-cam.appspot.com",
  messagingSenderId: "566961157745",
  appId: "1:566961157745:web:28633dd64f5fd262c24dd0",
  measurementId: "G-MYLGLJ83GN"
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);