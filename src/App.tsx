import React from 'react';
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {Auth} from "./components/Auth";
import {Main} from "./components/Main";
import {CreateRoom} from "./components/CreateRoom";
import {Room} from "./components/Room";
import {AppLayout} from "./layouts/AppLayout";


const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [{
      path: "/",
      element: <Auth />
    },
    {
      path: "/main",
      element: <Main />
    },
    {
      path: "/room/create",
      element: <CreateRoom />
    },
    {
      path: "/room/:roomId",
      element: <Room />
    }],
  },
])

function App() {

  return (
      <RouterProvider router={router} />
  );
}

export default App;
