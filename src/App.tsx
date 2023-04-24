import "./styles/Reset.scss";
import "./styles/App.scss";
import React from 'react';
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {SignIn} from "./components/SignIn";
import {SignUp} from "./components/SignUp";
import {Main} from "./components/Main";
import {CreateCamera} from "./components/CreateCamera";
import {Viewer} from "./components/Viewer";
import {AppLayout} from "./layouts/AppLayout";
import {Camera} from "./components/Camera";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [{
      path: "/",
      element: <SignIn />
    },
    {
      path: "/sign-up",
      element: <SignUp />
    },
    {
      path: "/main",
      element: <Main />
    },
    {
      path: "/camera",
      element: <CreateCamera />
    },
    {
      path: "/camera/:cameraId",
      element: <Camera />
    },
    {
      path: "/:viewerId",
      element: <Viewer />
    }],
  },
])

function App() {

  return (
    <RouterProvider router={router} />
  );
}

export default App;
