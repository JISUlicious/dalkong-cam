import "./common/styles/Reset.scss";
import "./common/styles/App.scss";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignIn } from "./auth/components/SignIn";
import { SignUp } from "./auth/components/SignUp";
import { Main } from "./common/components/Main";
import { CreateCamera } from "./camera/components/CreateCamera";
import { Viewer } from "./viewer/components/Viewer";
import { AppLayout } from "./common/layouts/AppLayout";
import { Camera } from "./camera/components/Camera";
import { StreamProvider } from "./common/contexts/StreamContext";
import { useAuthContext } from "./common/contexts/AuthContext";

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
