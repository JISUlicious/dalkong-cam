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
import { ConnectionProvider } from "./common/contexts/ConnectionContext";
import { useAuthContext } from "./common/contexts/AuthContext";
import { CreateViewer } from "./viewer/components/CreateViewer";
import { History } from "./history/components/History";

function App() {
  const {user} = useAuthContext();
  return (
    <ConnectionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="/" element={user ? <Main /> : <Navigate to={"/sign-in"} />} />
            <Route path="/sign-in" element={!user ? <SignIn /> : <Navigate to={"/"} />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/camera" element={<CreateCamera />} />
            <Route path="/viewer" element={<CreateViewer />} />
            <Route path="/camera/:cameraId" element={<Camera />} />
            <Route path="/viewer/:viewerId" element={<Viewer />} />
            <Route path="/history" element={<History />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConnectionProvider>
  );
}

export default App;
