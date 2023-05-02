import "./styles/Reset.scss";
import "./styles/App.scss";
import React from 'react';
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import {SignIn} from "./components/SignIn";
import {SignUp} from "./components/SignUp";
import {Main} from "./components/Main";
import {CreateCamera} from "./components/CreateCamera";
import {Viewer} from "./components/Viewer";
import {AppLayout} from "./layouts/AppLayout";
import {Camera} from "./components/Camera";
import {StreamProvider} from "./contexts/StreamContext";
import {useAuthContext} from "./contexts/AuthContext";

function App() {
  const {user} = useAuthContext();
  return (
    <StreamProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="/" element={user ? <Main /> : <Navigate to={"/sign-in"} />} />
            <Route path="/sign-in" element={!user ? <SignIn /> : <Navigate to={"/"} />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/camera" element={<CreateCamera />} />
            <Route path="/camera/:cameraId" element={<Camera />} />
            <Route path="/viewer/:viewerId" element={<Viewer />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </StreamProvider>
  );
}

export default App;
