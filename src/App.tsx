import "./common/styles/App.scss";

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignIn } from "./auth/view/SignIn";
import { SignUp } from "./auth/view/SignUp";
import { Main } from "./common/view/Main";
import { CreateCamera } from "./camera/view/CreateCamera";
import { Viewer } from "./viewer/view/Viewer";
import { AppLayout } from "./common/layouts/AppLayout";
import { Camera } from "./camera/view/Camera";
import { ConnectionProvider } from "./common/contexts/ConnectionContext";
import { useAuthContext } from "./common/contexts/AuthContext";
import { CreateViewer } from "./viewer/view/CreateViewer";
import { History } from "./history/view/History";

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
